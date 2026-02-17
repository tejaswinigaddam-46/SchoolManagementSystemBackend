const express = require('express');
const router = express.Router();
const weekendPolicyController = require('../controllers/weekendPolicy.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticate);

router.get(
  '/:campusId',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_LIST_READ),
  weekendPolicyController.getAllPolicies
);

router.post(
  '/:campusId',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_CREATE),
  weekendPolicyController.upsertPolicy
);

router.get(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_ITEM_READ),
  weekendPolicyController.getPolicy
);

router.delete(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.WEEKEND_POLICY_DELETE),
  weekendPolicyController.deletePolicy
);

module.exports = router;
