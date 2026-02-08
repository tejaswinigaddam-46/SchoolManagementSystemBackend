const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const controller = require('../controllers/sectionSubject.controller');

// POST /api/section-subjects/assign
router.post('/assign', authenticate, requireRole(['Admin', 'Superadmin', 'Zonaladmin']), controller.bulkAssign);
router.get('/', authenticate, controller.listBySections);
router.post('/unassign', authenticate, requireRole(['Admin', 'Superadmin', 'Zonaladmin']), controller.unassign);

module.exports = router;
