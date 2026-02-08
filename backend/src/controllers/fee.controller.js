const feeService = require('../services/fee.service');

// Create fee structure with installments (atomic)
const createFeeStructure = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.user?.campusId || req.user?.campus?.campus_id;

    if (!tenant_id) {
      return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }
    if (!campus_id) {
      return res.status(400).json({ success: false, message: 'Campus context missing' });
    }

    const payload = { ...req.body, campus_id };
    const result = await feeService.createFeeStructure(tenant_id, payload);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('createFeeStructure error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Failed to create fee structure' });
  }
};

// Collect a payment and allocate by oldest dues first
const collectPayment = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const collected_by = req.user?.userId || req.user?.user_id;

    if (!tenant_id) {
      return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }
    if (!collected_by) {
      return res.status(400).json({ success: false, message: 'Collector (user) context missing' });
    }

    const { student_username, student_id, total_amount_received, payment_method, remarks } = req.body || {};

    const result = await feeService.collectPayment({
      tenant_id,
      student_username,
      student_id,
      total_amount_received,
      payment_method,
      collected_by,
      remarks
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('collectPayment error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Failed to collect payment' });
  }
};

// Fee Types
const createFeeType = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.user?.campusId || req.user?.campus?.campus_id;

    if (!tenant_id) {
      return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }
    if (!campus_id) {
      return res.status(400).json({ success: false, message: 'Campus context missing' });
    }

    const payload = { ...req.body, campus_id };
    const result = await feeService.createFeeType(tenant_id, payload);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getFeeTypes = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.query.campus_id || req.user?.campus?.campus_id;
    if (!campus_id) return res.status(400).json({ success: false, message: 'Campus ID required' });
    const result = await feeService.getFeeTypes(tenant_id, campus_id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const updateFeeType = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const result = await feeService.updateFeeType(tenant_id, req.params.id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const deleteFeeType = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const result = await feeService.deleteFeeType(tenant_id, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Fee Structures
const getAllFeeStructures = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.query.campus_id || req.user?.campus?.campus_id;
    if (!campus_id) return res.status(400).json({ success: false, message: 'Campus ID required' });
    const result = await feeService.getAllFeeStructures(tenant_id, campus_id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getFeeStructureById = async (req, res) => {
  try {
    const result = await feeService.getFeeStructureById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const updateFeeStructure = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.user?.campusId || req.user?.campus?.campus_id;
    
    // We need campus_id for UUID generation if class changed. 
    // The frontend sends everything in body, but better to be safe.
    const payload = { ...req.body, campus_id: campus_id || req.body.campus_id };
    
    const result = await feeService.updateFeeStructure(tenant_id, req.params.id, payload);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const deleteFeeStructure = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const result = await feeService.deleteFeeStructure(tenant_id, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getInstallmentsByStructure = async (req, res) => {
  try {
    const result = await feeService.getInstallmentsByStructure(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Generate Dues
const generateDuesForClass = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const result = await feeService.generateDuesForClass({ ...req.body, tenant_id });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Student Dues
const getStudentFeeDues = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.query.campus_id || req.user?.campus?.campus_id;
    if (!campus_id) return res.status(400).json({ success: false, message: 'Campus ID required' });
    
    const filters = {
      student_id: req.query.student_id,
      class_id: req.query.class_id
    };
    const result = await feeService.getStudentFeeDues(tenant_id, campus_id, filters);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Payments History
const getAllPayments = async (req, res) => {
  try {
    const tenant_id = req.user?.tenantId || req.tenantId;
    const campus_id = req.query.campus_id || req.user?.campus?.campus_id;
    
    const filters = {
      student_id: req.query.student_id
    };
    const result = await feeService.getAllPayments(tenant_id, campus_id, filters);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createFeeStructure,
  collectPayment,
  createFeeType,
  getFeeTypes,
  updateFeeType,
  deleteFeeType,
  getAllFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  getInstallmentsByStructure,
  generateDuesForClass,
  getStudentFeeDues,
  getAllPayments
};