const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
  username: Joi.string().trim().min(3).required()
}).unknown(true);

const tenantContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
}).unknown(true);

const params = {
  id: Joi.number().integer().min(1).required()
};

const dateRangeQuery = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required()
}).unknown(true);

const createLeaveBody = Joi.object({
  leave_date: Joi.string().trim().min(1).required(),
  leave_reason: Joi.string().trim().min(1).required(),
  duration_days: Joi.number().integer().min(1).required(),
  duration_category: Joi.string().trim().valid('Full Day','Half Day','Hourly').required(),
  requester_role: Joi.string().trim().optional()
}).unknown(true);

const updateStatusBody = Joi.object({
  status: Joi.string().trim().valid('pending','approved','rejected','cancelled').required(),
  status_reason: Joi.string().trim().allow('', null).optional()
}).custom((value, helpers) => {
  if (value.status === 'rejected' && (!value.status_reason || value.status_reason.trim().length === 0)) {
    return helpers.message('status_reason is required for rejection');
  }
  return value;
}, 'Status reason validation').required();

const cancelBody = Joi.object({
  status_reason: Joi.string().trim().allow('', null).optional()
});

module.exports = {
  createLeave: {
    user: userContext,
    body: createLeaveBody
  },
  getMyLeaves: {
    user: userContext
  },
  getPendingApprovals: {
    user: userContext,
    query: dateRangeQuery
  },
  getCompletedApprovals: {
    user: userContext,
    query: dateRangeQuery
  },
  updateStatus: {
    user: userContext,
    params: Joi.object({ id: params.id }),
    body: updateStatusBody
  },
  deleteLeave: {
    user: tenantContext,
    params: Joi.object({ id: params.id })
  },
  cancelLeave: {
    user: userContext,
    params: Joi.object({ id: params.id }),
    body: cancelBody
  }
};

