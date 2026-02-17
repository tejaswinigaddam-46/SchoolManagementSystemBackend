const express = require('express');
const { getPayrollReport, getMyPayrollReport } = require('../controllers/payroll.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.post(
  '/report',
  authenticate,
  requirePermission(PERMISSIONS.PAYROLL_REPORT_READ),
  getPayrollReport
);

router.post(
  '/my',
  authenticate,
  requirePermission(PERMISSIONS.MY_PAYROLL_READ),
  getMyPayrollReport
);

module.exports = router;
