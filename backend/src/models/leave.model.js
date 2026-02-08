const { pool } = require('../config/database');

// Insert a new leave request
const createLeaveRequest = async (tenantId, campusId, data) => {
  const query = `
    INSERT INTO leave_requests (
      username,
      requester_role,
      campus_id,
      leave_date,
      leave_reason,
      duration_days,
      duration_category
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, username, requester_role, campus_id,
              request_date, leave_date, leave_reason, duration_days, duration_category,
              overall_status AS status
  `;
  const values = [
    data.username,
    data.requester_role,
    campusId,
    data.leave_date,
    data.leave_reason,
    data.duration_days,
    data.duration_category
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Bulk insert approval steps for a request
const createApprovalStepsBulk = async (leaveRequestId, items) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const createdSteps = [];
    for (const data of items) {
      const row = await client.query(
        `INSERT INTO leave_approval_steps (
          leave_request_id, approver_role, approver_username, step_order
        ) VALUES ($1,$2,$3,$4)
        RETURNING id, leave_request_id, approver_role, approver_username, status, step_order, comments, action_date`,
        [
          leaveRequestId,
          data.approver_role,
          data.approver_username,
          data.step_order
        ]
      );
      createdSteps.push(row.rows[0]);
    }
    await client.query('COMMIT');
    return createdSteps;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Get current user's leave requests (with rejected reasons aggregated)
const getMyLeaveRequests = async (tenantId, campusId, username) => {
  const result = await pool.query(
    `SELECT 
       r.id,
       r.username,
       r.requester_role,
       r.campus_id,
       r.request_date,
       r.leave_date,
       r.leave_reason,
       r.duration_days,
       r.duration_category,
       r.overall_status AS status,
       array_remove(array_agg(s.comments) FILTER (WHERE s.status = 'rejected'::leave_status), NULL) AS rejected_comments,
       array_remove(array_agg(s.approver_username) FILTER (WHERE s.status = 'rejected'::leave_status), NULL) AS rejected_by
     FROM leave_requests r
     LEFT JOIN leave_approval_steps s ON s.leave_request_id = r.id
     WHERE r.username = $1 AND r.campus_id = $2
     GROUP BY r.id
     ORDER BY r.request_date DESC`,
    [username, campusId]
  );
  return result.rows;
};

// Get requests where the user's step is pending, including full approver chain
const getPendingApprovalsForUser = async (username) => {
  const result = await pool.query(
    `SELECT 
       r.id AS id,
       r.username,
       r.requester_role,
       r.campus_id,
       r.request_date,
       r.leave_date,
       r.leave_reason,
       r.duration_days,
       r.duration_category,
       r.overall_status AS status,
       json_agg(
         json_build_object(
           'approver_username', s.approver_username,
           'approver_role', s.approver_role,
           'status', s.status,
           'step_order', s.step_order,
           'comments', s.comments,
           'action_date', s.action_date
         )
         ORDER BY s.step_order
       ) AS steps
     FROM leave_requests r
     JOIN leave_approval_steps s ON s.leave_request_id = r.id
     WHERE EXISTS (
       SELECT 1 
       FROM leave_approval_steps s2
       WHERE s2.leave_request_id = r.id 
         AND s2.approver_username = $1 
         AND s2.status = 'pending'::leave_status
     )
     GROUP BY r.id
     ORDER BY r.request_date DESC`,
    [username]
  );
  return result.rows;
};

// Get requests where the user's step is completed (approved/rejected)
const getCompletedApprovalsForUser = async (username) => {
  const result = await pool.query(
    `SELECT 
       r.id AS id,
       r.username,
       r.requester_role,
       r.campus_id,
       r.request_date,
       r.leave_date,
       r.leave_reason,
       r.duration_days,
       r.duration_category,
       r.overall_status AS status,
       json_agg(
         json_build_object(
           'approver_username', s.approver_username,
           'approver_role', s.approver_role,
           'status', s.status,
           'step_order', s.step_order,
           'comments', s.comments,
           'action_date', s.action_date
         )
         ORDER BY s.step_order
       ) AS steps
     FROM leave_requests r
     JOIN leave_approval_steps s ON s.leave_request_id = r.id
     WHERE EXISTS (
       SELECT 1 
       FROM leave_approval_steps s2
       WHERE s2.leave_request_id = r.id 
         AND s2.approver_username = $1 
         AND s2.status IN ('approved'::leave_status, 'rejected'::leave_status)
     )
     GROUP BY r.id
     ORDER BY r.request_date DESC`,
    [username]
  );
  return result.rows;
};

// Get leave request by id
const getLeaveRequestById = async (id) => {
  const result = await pool.query(
    `SELECT id, username, requester_role, campus_id,
            request_date, leave_date, leave_reason, duration_days, duration_category,
            overall_status AS status
     FROM leave_requests
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

// Cancel a leave request and any pending steps
const cancelRequestAndStepsById = async (id, statusReason = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE leave_requests
       SET overall_status = 'cancelled'::leave_status
       WHERE id = $1`,
      [id]
    );
    const steps = await client.query(
      `UPDATE leave_approval_steps
       SET status = 'cancelled'::leave_status, comments = COALESCE($2, comments), action_date = NOW()
       WHERE leave_request_id = $1 AND status = 'pending'::leave_status
       RETURNING id, leave_request_id, approver_role, approver_username, status, step_order, comments, action_date`,
      [id, statusReason]
    );
    await client.query('COMMIT');
    return steps.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Update status for an approver step
const updateApproverStepStatus = async (tenantId, campusId, leaveRequestId, approverUsername, status, comments = null) => {
  const result = await pool.query(
    `UPDATE leave_approval_steps
     SET status = $1::leave_status, comments = $2, action_date = NOW()
     WHERE leave_request_id = $3 AND approver_username = $4
     RETURNING id, leave_request_id, approver_role, approver_username, status, step_order, comments, action_date`,
    [status, comments, leaveRequestId, approverUsername]
  );
  return result.rows[0] || null;
};

// Recompute and update overall status for a leave request
const recomputeOverallStatus = async (leaveRequestId) => {
  const result = await pool.query(
    `UPDATE leave_requests
     SET overall_status = CASE
         WHEN EXISTS (
           SELECT 1 FROM leave_approval_steps s
           WHERE s.leave_request_id = $1 AND s.status = 'rejected'
         ) THEN 'rejected'::leave_status
         WHEN NOT EXISTS (
           SELECT 1 FROM leave_approval_steps s
           WHERE s.leave_request_id = $1 AND s.status IN ('pending'::leave_status,'rejected'::leave_status)
         ) THEN 'approved'::leave_status
         ELSE 'pending'::leave_status
       END
     WHERE id = $1
     RETURNING id, username, requester_role, campus_id,
               request_date, leave_date, leave_reason, duration_days, duration_category,
               overall_status AS status`
    ,
    [leaveRequestId]
  );
  return result.rows[0] || null;
};

// Delete a leave request
const deleteLeaveRequest = async (tenantId, campusId, id) => {
  const result = await pool.query(
    `DELETE FROM leave_requests WHERE id = $1 AND campus_id = $2 RETURNING id`,
    [id, campusId]
  );
  return result.rows.length > 0;
};

// Helper: resolve user's role from users + user_statuses for campus
const resolveUserRoleForCampus = async (username, campusId) => {
  const result = await pool.query(
    `SELECT u.role
     FROM users u
     JOIN user_statuses us
       ON us.username = u.username AND us.campus_id = $2
     WHERE u.username = $1
     LIMIT 1`,
    [username, campusId]
  );
  return result.rows[0]?.role || null;
};

// Helper: find primary teacher username for a student in campus
const findPrimaryTeacherForStudent = async (studentUsername, campusId) => {
  const result = await pool.query(
    `SELECT u.username
     FROM student_enrollment se
     JOIN class_sections cs ON cs.section_id = se.section_id AND cs.campus_id = se.campus_id
     JOIN users u ON u.user_id = cs.primary_teacher_user_id
     WHERE se.username = $1 AND se.campus_id = $2
     LIMIT 1`,
    [studentUsername, campusId]
  );
  return result.rows[0]?.username || null;
};

// Helper: find principal username for a campus
const findPrincipalForCampus = async (campusId) => {
  const result = await pool.query(
    `SELECT ed.username
     FROM employment_details ed
     WHERE ed.campus_id = $1 AND ed.designation = 'Principal'
     ORDER BY ed.joining_date ASC
     LIMIT 1`,
    [campusId]
  );
  return result.rows[0]?.username || null;
};

// Helper: find admin usernames for a campus
const findAdminsForCampus = async (campusId) => {
  const result = await pool.query(
    `SELECT u.username
     FROM users u
     JOIN user_statuses us ON us.username = u.username
     WHERE u.role = 'Admin' AND us.campus_id = $1`,
    [campusId]
  );
  return result.rows.map(r => r.username);
};

// Helper: find zonal/super admins for a tenant (tenant-level)
const findTenantAdmins = async (tenantId) => {
  const result = await pool.query(
    `SELECT DISTINCT u.username
     FROM users u
     JOIN user_statuses us ON us.username = u.username
     WHERE us.tenant_id = $1 AND u.role IN ('Zonaladmin','Superadmin')`,
    [tenantId]
  );
  return result.rows.map(r => r.username);
};

// Helper: get role by username (from users table)
const getUserRoleByUsername = async (username) => {
  const res = await pool.query(
    `SELECT role FROM users WHERE username = $1 LIMIT 1`,
    [username]
  );
  return res.rows[0]?.role || null;
};

// Helper: find linked students for a parent
const findStudentsForParent = async (parentUsername, campusId) => {
  const result = await pool.query(
    `SELECT spr.student_username
     FROM student_parent_relations spr
     WHERE spr.parent_username = $1 AND spr.campus_id = $2`,
    [parentUsername, campusId]
  );
  return result.rows.map(r => r.student_username);
};

// Check if user is assigned approver for a request
const isUserAssignedApproverForRequest = async (leaveRequestId, username) => {
  const res = await pool.query(
    `SELECT 1
     FROM leave_approval_steps
     WHERE leave_request_id = $1 AND approver_username = $2
     LIMIT 1`,
    [leaveRequestId, username]
  );
  return res.rowCount > 0;
};

module.exports = {
  createLeaveRequest,
  createApprovalStepsBulk,
  getMyLeaveRequests,
  getPendingApprovalsForUser,
  getCompletedApprovalsForUser,
  getLeaveRequestById,
  cancelRequestAndStepsById,
  updateApproverStepStatus,
  recomputeOverallStatus,
  deleteLeaveRequest,
  resolveUserRoleForCampus,
  findPrimaryTeacherForStudent,
  findPrincipalForCampus,
  findAdminsForCampus,
  findTenantAdmins,
  getUserRoleByUsername,
  findStudentsForParent,
  isUserAssignedApproverForRequest
};
