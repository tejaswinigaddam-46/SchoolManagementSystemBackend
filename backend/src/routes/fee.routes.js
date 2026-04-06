const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const feeController = require('../controllers/fee.controller');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const feeSchema = require('../schemas/fee.schema');

const router = express.Router();

router.post(
  '/fee-types',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_CREATE),
  validate(feeSchema.createFeeType),
  feeController.createFeeType
);
router.get(
  '/fee-types',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_LIST_READ),
  validate(feeSchema.getFeeTypes),
  feeController.getFeeTypes
);
router.put(
  '/fee-types/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_EDIT),
  validate(feeSchema.updateFeeType),
  feeController.updateFeeType
);
router.delete(
  '/fee-types/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_TYPE_DELETE),
  validate(feeSchema.deleteFeeType),
  feeController.deleteFeeType
);

router.post(
  '/fee-structures',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_CREATE),
  validate(feeSchema.createFeeStructure),
  feeController.createFeeStructure
);
router.get(
  '/fee-structures',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_LIST_READ),
  validate(feeSchema.getAllFeeStructures),
  feeController.getAllFeeStructures
);
router.get(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_ITEM_READ),
  validate(feeSchema.getFeeStructureById),
  feeController.getFeeStructureById
);
router.put(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_EDIT),
  validate(feeSchema.updateFeeStructure),
  feeController.updateFeeStructure
);
router.delete(
  '/fee-structures/:id',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STRUCTURE_DELETE),
  validate(feeSchema.deleteFeeStructure),
  feeController.deleteFeeStructure
);

router.post(
  '/dues/generate',
  authenticate,
  requirePermission(PERMISSIONS.FEE_DUES_GENERATE_CREATE),
  validate(feeSchema.generateDuesForClass),
  feeController.generateDuesForClass
);

router.get(
  '/dues/student',
  authenticate,
  requirePermission(PERMISSIONS.FEE_STUDENT_DUES_READ),
  validate(feeSchema.getStudentFeeDues),
  feeController.getStudentFeeDues
);
router.get(
  '/payments',
  authenticate,
  requirePermission(PERMISSIONS.FEE_PAYMENTS_LIST_READ),
  validate(feeSchema.getAllPayments),
  feeController.getAllPayments
);

router.post(
  '/payments/collect',
  authenticate,
  requirePermission(PERMISSIONS.FEE_PAYMENTS_COLLECT_CREATE),
  validate(feeSchema.collectPayment),
  feeController.collectPayment
);

module.exports = router;
