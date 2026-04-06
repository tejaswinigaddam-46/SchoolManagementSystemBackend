const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/permission.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const permissionSchema = require('../schemas/permission.schema');

router.get(
  '/campus/current',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_CAMPUS_READ),
  validate(permissionSchema.getRolePermissionsForCampus),
  PermissionController.getRolePermissionsForCampus
);
router.post(
  '/campus/current',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_CREATE),
  validate(permissionSchema.createRolePermission),
  PermissionController.createRolePermission
);
router.delete(
  '/campus/current/:role_name/:permission_code',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_DELETE),
  validate(permissionSchema.deleteRolePermission),
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
  validate(permissionSchema.createPermission),
  PermissionController.createPermission
);
router.get(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_ITEM_READ),
  validate(permissionSchema.getPermissionByCode),
  PermissionController.getPermissionByCode
);
router.put(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_EDIT),
  validate(permissionSchema.updatePermission),
  PermissionController.updatePermission
);
router.delete(
  '/:code',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_DELETE_ROUTE_DELETE),
  validate(permissionSchema.deletePermission),
  PermissionController.deletePermission
);

module.exports = router;
