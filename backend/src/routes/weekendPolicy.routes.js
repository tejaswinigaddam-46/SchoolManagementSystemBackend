const express = require('express');
const router = express.Router();
const weekendPolicyController = require('../controllers/weekendPolicy.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const weekendPolicySchema = require('../schemas/weekendPolicy.schema');

router.use(authenticate);

router.get(
  '/:campusId',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_LIST_READ),
  validate(weekendPolicySchema.getAllPolicies),
  weekendPolicyController.getAllPolicies
);

router.post(
  '/:campusId',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_CREATE),
  validate(weekendPolicySchema.upsertPolicy),
  weekendPolicyController.upsertPolicy
);

router.get(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_ITEM_READ),
  validate(weekendPolicySchema.getPolicy),
  weekendPolicyController.getPolicy
);

router.delete(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_DELETE),
  validate(weekendPolicySchema.deletePolicy),
  weekendPolicyController.deletePolicy
);

module.exports = router;
