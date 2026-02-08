const express = require('express');
const router = express.Router();
const specialWorkingDayController = require('../controllers/specialWorkingDay.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/', requireRole(['Admin']), specialWorkingDayController.create);
router.get('/', specialWorkingDayController.getAll);
router.put('/:id', requireRole(['Admin']), specialWorkingDayController.update);
router.delete('/:id', requireRole(['Admin']), specialWorkingDayController.delete);

module.exports = router;
