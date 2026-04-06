const express = require('express');
const { getPayrollReport, getMyPayrollReport } = require('../controllers/payroll.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const payrollSchema = require('../schemas/payroll.schema');

const router = express.Router();

router.post(
  '/report',
  authenticate,
  requirePermission(PERMISSIONS.PAYROLL_REPORT_READ),
  validate(payrollSchema.getPayrollReport),
  getPayrollReport
);

router.post(
  '/my',
  authenticate,
  requirePermission(PERMISSIONS.MY_PAYROLL_READ),
  validate(payrollSchema.getMyPayrollReport),
  getMyPayrollReport
);

module.exports = router;
