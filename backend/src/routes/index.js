const express = require('express');
const tenantRoutes = require('./tenant.routes');
const authRoutes = require('./auth.routes');
const campusRoutes = require('./campus.routes');
const buildingRoutes = require('./building.routes');
const roomRoutes = require('./room.routes');
const studentRoutes = require('./student.routes');
const userRoutes = require('./user.routes');
const employeeRoutes = require('./employee.routes');
const academicRoutes = require('./academic.routes');
const subjectRoutes = require('./subject.routes');
const eventRoutes = require('./event.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const holidayRoutes = require('./holiday.routes');
const weekendPolicyRoutes = require('./weekendPolicy.routes');
const specialWorkingDayRoutes = require('./specialWorkingDay.routes');
const consolidatedAttendanceRoutes = require('./consolidatedAttendance.routes');
const sectionSubjectRoutes = require('./sectionSubject.routes');
const classRoutes = require('./class.routes');
const sectionRoutes = require('./section.routes');
const feeRoutes = require('./fee.routes');
const payrollRoutes = require('./payroll.routes');
const examRoutes = require('./exam.routes');
const examResultRoutes = require('./examResult.routes');

const router = express.Router();

// API version and info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Management System API',
    version: '1.0.0',
    tenant: req.tenantId,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      tenants: '/api/tenants',
      campuses: '/api/campuses',
      buildings: '/api/buildings',
      rooms: '/api/rooms',
      students: '/api/students',
      employees: '/api/employees',
      classes: '/api/classes',
      sections: '/api/sections',
      academics: '/api/academics',
      subjects: '/api/subjects',
      events: '/api/events',
      payroll: '/api/payroll',
      fees: '/api/fees',
      registerTenant: '/api/register-tenant',
      health: '/health'
    }
  });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/campuses', campusRoutes);
router.use('/buildings', buildingRoutes);
router.use('/rooms', roomRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/employees', employeeRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/academics', academicRoutes);
router.use('/subjects', subjectRoutes);
router.use('/section-subjects', sectionSubjectRoutes);
router.use('/events', eventRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave-requests', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/weekend-policies', weekendPolicyRoutes);
router.use('/special-working-days', specialWorkingDayRoutes);
router.use('/consolidated-attendance', consolidatedAttendanceRoutes);
router.use('/payroll', payrollRoutes);
router.use('/fees', feeRoutes);
router.use('/exams', examRoutes);
router.use('/exam-results', examResultRoutes);

// Special public endpoint for tenant registration (outside of /tenants)
router.post('/register-tenant', require('../controllers/tenant.controller').registerTenant);

// Future routes can be added here
// router.use('/staff', staffRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/grades', gradeRoutes);
// router.use('/fees', feeRoutes);

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl
  });
});

module.exports = router;
