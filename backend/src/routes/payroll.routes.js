const express = require('express');
const { getPayrollReport } = require('../controllers/payroll.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/report', authenticate, requireRole(['Admin', 'Superadmin', 'Zonaladmin']), getPayrollReport);

module.exports = router;
