const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const feeController = require('../controllers/fee.controller');

const router = express.Router();

// Fee Types Management
router.post('/fee-types', authenticate, requireRole(['Admin', 'Employee']), feeController.createFeeType);
router.get('/fee-types', authenticate, requireRole(['Admin', 'Employee']), feeController.getFeeTypes);
router.put('/fee-types/:id', authenticate, requireRole(['Admin', 'Employee']), feeController.updateFeeType);
router.delete('/fee-types/:id', authenticate, requireRole(['Admin', 'Employee']), feeController.deleteFeeType);

// Fee Structures
router.post('/fee-structures', authenticate, requireRole(['Admin', 'Employee']), feeController.createFeeStructure);
router.get('/fee-structures', authenticate, requireRole(['Admin', 'Employee']), feeController.getAllFeeStructures);
router.get('/fee-structures/:id', authenticate, requireRole(['Admin', 'Employee']), feeController.getFeeStructureById);
router.put('/fee-structures/:id', authenticate, requireRole(['Admin', 'Employee']), feeController.updateFeeStructure);
router.delete('/fee-structures/:id', authenticate, requireRole(['Admin', 'Employee']), feeController.deleteFeeStructure);

// Dues Generation (Bulk)
router.post('/dues/generate', authenticate, requireRole(['Admin', 'Employee']), feeController.generateDuesForClass);

// Reporting & Student Ledger
router.get('/dues/student', authenticate, requireRole(['Admin', 'Employee', 'Student', 'Parent']), feeController.getStudentFeeDues);
router.get('/payments', authenticate, requireRole(['Admin', 'Employee']), feeController.getAllPayments);

// Collect a payment (waterfall allocation)
router.post('/payments/collect', authenticate, requireRole(['Admin', 'Employee', 'Teacher']), feeController.collectPayment);

module.exports = router;