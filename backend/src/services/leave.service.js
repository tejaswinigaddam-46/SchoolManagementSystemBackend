const leaveModel = require('../models/leave.model');

const determineApprovers = async (tenantId, campusId, requesterUsername, requesterRole) => {
  const approvers = [];
  const role = String(requesterRole);

  if (role === 'Student') {
    const primaryTeacher = await leaveModel.findPrimaryTeacherForStudent(requesterUsername, campusId);
    if (primaryTeacher) approvers.push({ username: primaryTeacher, role: 'Teacher' });
    const principal = await leaveModel.findPrincipalForCampus(campusId);
    if (principal) approvers.push({ username: principal, role: 'Employee' }); // role may be Employee with designation Principal
    const admins = await leaveModel.findAdminsForCampus(campusId);
    admins.forEach(u => approvers.push({ username: u, role: 'Admin' }));
  } else if (role === 'Teacher' || role === 'Employee') {
    const principal = await leaveModel.findPrincipalForCampus(campusId);
    if (principal) approvers.push({ username: principal, role: 'Employee' });
    const admins = await leaveModel.findAdminsForCampus(campusId);
    admins.forEach(u => approvers.push({ username: u, role: 'Admin' }));
  } else if (role === 'Admin') {
    const tenantAdmins = await leaveModel.findTenantAdmins(tenantId);
    tenantAdmins.forEach(u => {
      // Determine actual role for display: Zonaladmin or Superadmin
      approvers.push({ username: u, role: 'Admin' }); // fallback
    });
    // If possible, replace with actual roles
    for (let i = 0; i < approvers.length; i++) {
      const actualRole = await leaveModel.getUserRoleByUsername(approvers[i].username);
      if (actualRole) approvers[i].role = actualRole;
    }
  } else {
    // Default: send to Admins at campus
    const admins = await leaveModel.findAdminsForCampus(campusId);
    admins.forEach(u => approvers.push({ username: u, role: 'Admin' }));
  }

  // De-duplicate by username
  const unique = [];
  const seen = new Set();
  for (const a of approvers) {
    if (!seen.has(a.username)) {
      seen.add(a.username);
      unique.push(a);
    }
  }
  return unique;
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

  if (!data.leave_date) throw new Error('leave_date is required');
  if (!data.leave_reason) throw new Error('leave_reason is required');
  if (!data.duration_days || Number(data.duration_days) <= 0) throw new Error('duration_days must be > 0');
  if (!data.duration_category) throw new Error('duration_category is required');

  const approverChain = await determineApprovers(tenantId, campusId, requesterUsername, requester_role);
  if (approverChain.length === 0) {
    approverChain.push({ username: requesterUsername, role: requester_role });
  }

  const createdRequest = await leaveModel.createLeaveRequest(tenantId, campusId, data);

  const stepItems = approverChain.map((ap, idx) => ({
    approver_role: ap.role,
    approver_username: ap.username,
    step_order: idx + 1
  }));
  await leaveModel.createApprovalStepsBulk(createdRequest.id, stepItems);
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

const getPendingApprovals = async (tenantId, campusId, approverUsername, approverRole) => {
  const assigned = await leaveModel.getPendingApprovalsForUser(approverUsername);
  if (approverRole === 'Zonaladmin' || approverRole === 'Superadmin') {
    return assigned;
  }
  return assigned;
};

const getCompletedApprovals = async (tenantId, campusId, approverUsername, approverRole) => {
  return await leaveModel.getCompletedApprovalsForUser(approverUsername);
};

const updateLeaveStatus = async (tenantId, campusId, id, status, status_reason, approverUsername) => {
  if (!['pending','approved','rejected','cancelled'].includes(String(status))) {
    throw new Error('Invalid status');
  }
  if (String(status) === 'rejected' && (!status_reason || String(status_reason).trim().length === 0)) {
    throw new Error('status_reason is required for rejection');
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
