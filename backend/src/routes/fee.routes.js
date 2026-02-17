const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const feeController = require('../controllers/fee.controller');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.post(
  '/fee-types',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_CREATE),
  feeController.createFeeType
);
router.get(
  '/fee-types',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_LIST_READ),
  feeController.getFeeTypes
);
router.put(
  '/fee-types/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_EDIT),
  feeController.updateFeeType
);
router.delete(
  '/fee-types/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_DELETE),
  feeController.deleteFeeType
);

router.post(
  '/fee-structures',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_CREATE),
  feeController.createFeeStructure
);
router.get(
  '/fee-structures',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_LIST_READ),
  feeController.getAllFeeStructures
);
router.get(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_ITEM_READ),
  feeController.getFeeStructureById
);
router.put(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_EDIT),
  feeController.updateFeeStructure
);
router.delete(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_DELETE),
  feeController.deleteFeeStructure
);

router.post(
  '/dues/generate',
  authenticate,
  requirePermission(PERMISSIONS.FEE_DUES_GENERATE_CREATE),
  feeController.generateDuesForClass
);

router.get(
  '/dues/student',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STUDENT_DUES_READ),
  feeController.getStudentFeeDues
);
router.get(
  '/payments',
  authenticate,
  requirePermission(PERMISSIONS.FEE_PAYMENTS_LIST_READ),
  feeController.getAllPayments
);

router.post(
  '/payments/collect',
  authenticate,
  requirePermission(PERMISSIONS.FEE_PAYMENTS_COLLECT_CREATE),
  feeController.collectPayment
);

module.exports = router;
