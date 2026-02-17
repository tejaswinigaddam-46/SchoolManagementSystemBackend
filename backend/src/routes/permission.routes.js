const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/permission.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get(
  '/campus/current',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_CAMPUS_READ),
  PermissionController.getRolePermissionsForCampus
);
router.post(
  '/campus/current',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_CREATE),
  PermissionController.createRolePermission
);
router.delete(
  '/campus/current/:role_name/:permission_code',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_DELETE),
  PermissionController.deleteRolePermission
);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_LIST_READ),
  PermissionController.getAllPermissions
);
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_CREATE_ROUTE_CREATE),
  PermissionController.createPermission
);
router.get(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_ITEM_READ),
  PermissionController.getPermissionByCode
);
router.put(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_EDIT),
  PermissionController.updatePermission
);
router.delete(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_DELETE_ROUTE_DELETE),
  PermissionController.deletePermission
);

module.exports = router;
