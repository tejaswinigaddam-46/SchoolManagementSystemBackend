const leaveModel = require('../models/leave.model');

const uniqueByUsername = (items) => {
  const out = [];
  const seen = new Set();
  for (const it of items || []) {
    const username = String(it?.username || '').trim();
    if (!username) continue;
    if (seen.has(username)) continue;
    seen.add(username);
    out.push({ ...it, username });
  }
  return out;
};

const getTenantApproverBuckets = async (tenantId) => {
  const usernames = await leaveModel.findTenantAdmins(tenantId);
  const buckets = { zonal: [], super: [] };
  for (const u of usernames || []) {
    const username = String(u || '').trim();
    if (!username) continue;
    const role = await leaveModel.getUserRoleByUsername(username);
    if (role === 'Superadmin') buckets.super.push({ username, role: 'Superadmin' });
    else if (role === 'Zonaladmin') buckets.zonal.push({ username, role: 'Zonaladmin' });
  }
  buckets.zonal = uniqueByUsername(buckets.zonal);
  buckets.super = uniqueByUsername(buckets.super);
  return buckets;
};

const determineApprovers = async (tenantId, campusId, requesterUsername, requesterRole) => {
  const role = String(requesterRole || '');
  const requester = String(requesterUsername || '').trim();
  const { zonal, super: superAdmins } = await getTenantApproverBuckets(tenantId);

  const campusAdmins = uniqueByUsername(
    (await leaveModel.findAdminsForCampus(campusId)).map(u => ({ username: u, role: 'Admin' }))
  ).filter(a => a.username !== requester);

  const pickTenantZonal = () => zonal.filter(a => a.username !== requester);
  const pickTenantSuper = () => superAdmins.filter(a => a.username !== requester);

  if (role === 'Superadmin') {
    return [{ username: requester, role: 'Superadmin', autoApprove: true }];
  }

  if (role === 'Zonaladmin') {
    return pickTenantSuper();
  }

  if (role === 'Admin') {
    const z = pickTenantZonal();
    if (z.length > 0) return z;
    return pickTenantSuper();
  }

  if (role === 'Employee') {
    if (campusAdmins.length > 0) return campusAdmins;
    const z = pickTenantZonal();
    if (z.length > 0) return z;
    return pickTenantSuper();
  }

  if (role === 'Teacher') {
    const principal = String((await leaveModel.findPrincipalForCampus(campusId)) || '').trim();
    if (principal && principal !== requester) return [{ username: principal, role: 'Employee' }];
    if (campusAdmins.length > 0) return campusAdmins;
    const z = pickTenantZonal();
    if (z.length > 0) return z;
    return pickTenantSuper();
  }

  if (role === 'Student') {
    const primaryTeacher = String((await leaveModel.findPrimaryTeacherForStudent(requester, campusId)) || '').trim();
    if (primaryTeacher && primaryTeacher !== requester) return [{ username: primaryTeacher, role: 'Teacher' }];
    const principal = String((await leaveModel.findPrincipalForCampus(campusId)) || '').trim();
    if (principal && principal !== requester) return [{ username: principal, role: 'Employee' }];
    if (campusAdmins.length > 0) return campusAdmins;
    const z = pickTenantZonal();
    if (z.length > 0) return z;
    return pickTenantSuper();
  }

  if (campusAdmins.length > 0) return campusAdmins;
  const z = pickTenantZonal();
  if (z.length > 0) return z;
  return pickTenantSuper();
};

const createLeaveRequest = async (tenantId, campusId, requesterUsername, payload) => {
  const resolvedRole = await leaveModel.resolveUserRoleForCampus(requesterUsername, campusId);
  const requester_role = resolvedRole || payload.requester_role || null;

  const data = {
    username: requesterUsername,
    requester_role,
    leave_date: payload.leave_date,
    leave_reason: payload.leave_reason,
    duration_days: payload.duration_days,
    duration_category: payload.duration_category
  };

  // Input shape is validated by schema at route level

  const approverChain = await determineApprovers(tenantId, campusId, requesterUsername, requester_role);
  if (approverChain.length === 0) {
    const error = new Error('No approvers found in hierarchy for this leave request');
    error.statusCode = 400;
    throw error;
  }

  const createdRequest = await leaveModel.createLeaveRequest(tenantId, campusId, data);

  const stepItems = approverChain.map((ap, idx) => ({
    approver_role: ap.role,
    approver_username: ap.username,
    step_order: idx + 1
  }));
  await leaveModel.createApprovalStepsBulk(createdRequest.id, stepItems);

  if (String(requester_role) === 'Superadmin') {
    await leaveModel.updateApproverStepStatus(tenantId, campusId, createdRequest.id, requesterUsername, 'approved', 'Auto-approved');
    const updated = await leaveModel.recomputeOverallStatus(createdRequest.id);
    return updated || createdRequest;
  }

  return createdRequest;
};

const getMyLeaveRequests = async (tenantId, campusId, username) => {
  const role = await leaveModel.resolveUserRoleForCampus(username, campusId);
  if (role === 'Parent') {
    const studentUsernames = await leaveModel.findStudentsForParent(username, campusId);
    const own = await leaveModel.getMyLeaveRequests(tenantId, campusId, username);
    const all = [...own];
    for (const s of studentUsernames) {
      const rows = await leaveModel.getMyLeaveRequests(tenantId, campusId, s);
      all.push(...rows);
    }
    all.sort((a,b) => new Date(b.request_date) - new Date(a.request_date));
    return all;
  }
  return await leaveModel.getMyLeaveRequests(tenantId, campusId, username);
};

const getPendingApprovals = async (tenantId, campusId, approverUsername) => {
  const assigned = await leaveModel.getPendingApprovalsForUser(approverUsername);
  return assigned;
};

const getCompletedApprovals = async (tenantId, campusId, approverUsername) => {
  return await leaveModel.getCompletedApprovalsForUser(approverUsername);
};

const updateLeaveStatus = async (tenantId, campusId, id, status, status_reason, approverUsername) => {
  const request = await leaveModel.getLeaveRequestById(id);
  if (!request) {
    const error = new Error('Leave request not found');
    error.statusCode = 404;
    throw error;
  }

  const assigned = await leaveModel.isUserAssignedApproverForRequest(id, approverUsername);
  if (!assigned) {
    const error = new Error('Access denied. You are not authorized to update this request.');
    error.statusCode = 403;
    throw error;
  }

  const step = await leaveModel.updateApproverStepStatus(tenantId, campusId, id, approverUsername, status, status_reason);
  if (!step) return null;
  if (status === 'approved' || status === 'rejected') {
    await leaveModel.recomputeOverallStatus(id);
  }
  return step;
};

const deleteLeaveRequest = async (tenantId, campusId, id) => {
  return await leaveModel.deleteLeaveRequest(tenantId, campusId, id);
};

const cancelLeaveByRequester = async (tenantId, campusId, id, requesterUsername, status_reason = null) => {
  const req = await leaveModel.getLeaveRequestById(id);
  if (!req) throw new Error('Leave request not found');
  if (req.username !== requesterUsername) {
    throw new Error('Student can only cancel the request.');
  }
  const updatedRows = await leaveModel.cancelRequestAndStepsById(id, status_reason || null);
  return updatedRows;
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getPendingApprovals,
  getCompletedApprovals,
  updateLeaveStatus,
  deleteLeaveRequest,
  cancelLeaveByRequester
};
