const { pool } = require('../config/database');
const feeModel = require('../models/fee.model');
const logger = require('../utils/logger');
const { v5: uuidv5 } = require('uuid');

// Deterministic namespaces for UUIDv5 generation
const NAMESPACE_CLASS = '4d8a1f6c-0cb0-4c3e-9e5d-4f9fd1fbb001';
const NAMESPACE_STUDENT = '4d8a1f6c-0cb0-4c3e-9e5d-4f9fd1fbb002';

// Helpers
const toClassUUID = (campus_id, class_name) => uuidv5(`${campus_id}::${class_name}`, NAMESPACE_CLASS);
const toStudentUUID = (username) => uuidv5(username, NAMESPACE_STUDENT);

// ==================== FEE TYPES ====================
const createFeeType = async (tenant_id, data) => {
  if (!tenant_id) throw new Error('tenant_id required');
  if (!data.campus_id) throw new Error('campus_id required');
  if (!data.fee_type_name) throw new Error('fee_type_name required');

  const client = await pool.connect();
  try {
    const result = await feeModel.createFeeType(client, {
      tenant_id,
      campus_id: data.campus_id,
      name: data.fee_type_name,
      description: data.description
    });
    return result;
  } finally {
    client.release();
  }
};

const getFeeTypes = async (tenant_id, campus_id) => {
  return await feeModel.getFeeTypes(tenant_id, campus_id);
};

const updateFeeType = async (tenant_id, fee_type_id, data) => {
  const client = await pool.connect();
  try {
    const payload = {
      name: data.fee_type_name,
      description: data.description
    };
    return await feeModel.updateFeeType(client, fee_type_id, payload);
  } finally {
    client.release();
  }
};

const deleteFeeType = async (tenant_id, fee_type_id) => {
  const client = await pool.connect();
  try {
    return await feeModel.deleteFeeType(client, fee_type_id);
  } finally {
    client.release();
  }
};

// ==================== FEE SETUP ====================
/**
 * Create fee_structure and fee_installments atomically
 * data: { campus_id, academic_year_id, class_name or class_id, fee_type_id, total_amount, installments: [{installment_name, due_date, amount, penalty_amount?}] }
 */
const createFeeStructure = async (tenant_id, data) => {
  if (!tenant_id) throw new Error('tenant_id required');
  if (!data.campus_id) throw new Error('campus_id required');
  if (!data.academic_year_id) throw new Error('academic_year_id required');
  if (!data.fee_type_id) throw new Error('fee_type_id required');
  if (!data.total_amount && data.total_amount !== 0) throw new Error('total_amount required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let class_uuid = data.class_id;

    // If class_id is numeric (integer ID from dropdown) or we have class_name, ensure we generate the UUID
    // Note: If class_id is already a UUID, this logic might be skipped, but typically it comes as integer from UI
    if (data.class_name) {
      class_uuid = toClassUUID(data.campus_id, data.class_name);
    } else if (data.class_id && !isNaN(data.class_id)) {
      // It's an integer ID, fetch class name
      const res = await client.query('SELECT class_name FROM classes WHERE class_id = $1', [data.class_id]);
      if (res.rows.length === 0) throw new Error('Class not found');
      class_uuid = toClassUUID(data.campus_id, res.rows[0].class_name);
    }

    const payload = {
      tenant_id,
      campus_id: data.campus_id,
      academic_year_id: data.academic_year_id,
      class_id: class_uuid,
      fee_type_id: data.fee_type_id,
      total_amount: Number(data.total_amount),
      installments: Array.isArray(data.installments) ? data.installments : []
    };

    const result = await feeModel.createFeeStructureWithInstallments(client, payload);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error creating fee structure:', err);
    throw err;
  } finally {
    client.release();
  }
};

const getAllFeeStructures = async (tenant_id, campus_id) => {
  const structures = await feeModel.getAllFeeStructures(tenant_id, campus_id);
  
  // Enrich with class names
  const classRes = await pool.query('SELECT class_name FROM classes WHERE campus_id = $1', [campus_id]);
  const uuidMap = {};
  classRes.rows.forEach(c => {
    const u = toClassUUID(campus_id, c.class_name);
    uuidMap[u] = c.class_name;
  });
  
  return structures.map(s => ({
    ...s,
    class_name: uuidMap[s.class_id] || 'Unknown Class'
  }));
};

const getFeeStructureById = async (fee_structure_id) => {
  const structure = await feeModel.getFeeStructureById(fee_structure_id);
  if (!structure) return null;
  
  const installments = await feeModel.getInstallmentsByStructure(fee_structure_id);
  
  // Enrich with class name if possible, though we need campus_id. 
  // We can fetch class name using class_id UUID by querying classes table with matching generated UUID? 
  // Reverse lookup of UUIDv5 is impossible. 
  // But we can query all classes for the campus and match.
  // Or just return the ID and let frontend handle it (frontend has list of classes).
  // The frontend needs `class_id` as the integer ID if possible, or we just send back what we have.
  // Wait, `class_id` in `fee_structures` is a UUID. The frontend `AcademicYearSelector` + Class Dropdown expects an integer ID.
  // The frontend `feeStructures` table display handled this by `getAllFeeStructures` doing a map lookup.
  // We should do the same here if we want to pre-fill the form correctly.
  
  let class_id_int = null;
  // We need campus_id to look up classes.
  if (structure.campus_id) {
     const classRes = await pool.query('SELECT class_id, class_name FROM classes WHERE campus_id = $1', [structure.campus_id]);
     for (const c of classRes.rows) {
        if (toClassUUID(structure.campus_id, c.class_name) === structure.class_id) {
           class_id_int = c.class_id;
           structure.class_name = c.class_name;
           break;
        }
     }
  }

  return {
    ...structure,
    class_id: class_id_int || structure.class_id, // Prefer integer ID for frontend form
    installments
  };
};

const updateFeeStructure = async (tenant_id, fee_structure_id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Resolve class UUID if needed
    let class_uuid = data.class_id;
    if (data.class_name) {
       class_uuid = toClassUUID(data.campus_id, data.class_name);
    } else if (data.class_id && !isNaN(data.class_id)) {
       const res = await client.query('SELECT class_name FROM classes WHERE class_id = $1', [data.class_id]);
       if (res.rows.length > 0) {
         class_uuid = toClassUUID(data.campus_id, res.rows[0].class_name);
       }
    }

    // 2. Update parent structure
    const updatePayload = {
      academic_year_id: data.academic_year_id,
      class_id: class_uuid,
      fee_type_id: data.fee_type_id,
      total_amount: Number(data.total_amount)
    };
    
    const updatedStructure = await feeModel.updateFeeStructure(client, fee_structure_id, updatePayload);

    // 3. Replace Installments
    await feeModel.deleteInstallmentsByStructure(client, fee_structure_id);
    
    const insertInstallmentQ = `
      INSERT INTO fee_installments (
        fee_structure_id, installment_name, due_date, amount, penalty_amount
      ) VALUES ($1, $2, $3, $4, COALESCE($5, 0))
      RETURNING *
    `;

    const installmentRows = [];
    for (const ins of data.installments || []) {
      const row = await client.query(insertInstallmentQ, [
        fee_structure_id,
        ins.installment_name,
        ins.due_date,
        ins.amount,
        ins.penalty_amount || 0
      ]);
      installmentRows.push(row.rows[0]);
    }

    await client.query('COMMIT');
    return { ...updatedStructure, installments: installmentRows };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteFeeStructure = async (tenant_id, fee_structure_id) => {
  const client = await pool.connect();
  try {
    return await feeModel.deleteFeeStructure(client, fee_structure_id);
  } finally {
    client.release();
  }
};

const getInstallmentsByStructure = async (fee_structure_id) => {
  return await feeModel.getInstallmentsByStructure(fee_structure_id);
};

// ==================== DUES GENERATION ====================

// 1. Assign fees for a single enrollment (helper used by enrollment flow and bulk generation)
const assignFeesForEnrollmentWithClient = async (client, { tenant_id, campus_id, academic_year_id, class_name, username }) => {
  // Logic to find matching fee structures and create dues
  // 1. Get student UUID
  const student_id = toStudentUUID(username);
  const class_id = toClassUUID(campus_id, class_name);

  // 2. Get all fee structures for this class
  const feeStructures = await feeModel.getFeeStructuresForClass(campus_id, academic_year_id, class_id);
  
  let assignedCount = 0;

  for (const fs of feeStructures) {
    // Get installments
    const installments = await feeModel.getInstallmentsByStructure(fs.fee_structure_id);
    
    for (const ins of installments) {
      // Create student due
      await feeModel.upsertStudentDue(client, {
        student_id,
        installment_id: ins.installment_id,
        amount: ins.amount
      });
    }
    assignedCount++;
  }

  return { assigned: assignedCount };
};

const assignFeesForEnrollment = async (data) => {
  const client = await pool.connect();
  try {
    return await assignFeesForEnrollmentWithClient(client, data);
  } finally {
    client.release();
  }
};

const generateDuesForClass = async ({ tenant_id, campus_id, academic_year_id, class_id }) => {
  if (!tenant_id || !campus_id || !academic_year_id || !class_id) {
    throw new Error('Missing required parameters');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get class name (needed for enrollment lookup)
    const classRes = await client.query('SELECT class_name FROM classes WHERE class_id = $1', [class_id]);
    if (classRes.rows.length === 0) throw new Error('Class not found');
    const class_name = classRes.rows[0].class_name;

    // 2. Get all students in this class/year
    const studentsQ = `
      SELECT username 
      FROM student_enrollment 
      WHERE campus_id = $1 AND academic_year_id = $2 AND class_name = $3
    `;
    const studentsRes = await client.query(studentsQ, [campus_id, academic_year_id, class_name]);
    const students = studentsRes.rows;

    let totalAssigned = 0;
    
    // 2. Iterate and assign
    for (const student of students) {
       const res = await assignFeesForEnrollmentWithClient(client, {
         tenant_id,
         campus_id,
         academic_year_id,
         class_name,
         username: student.username
       });
       if (res.assigned > 0) totalAssigned++;
    }

    await client.query('COMMIT');
    return { totalStudents: students.length, totalAssigned };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error generating dues for class:', err);
    throw err;
  } finally {
    client.release();
  }
};

// ==================== REPORTING & LEDGER ====================
const getStudentFeeDues = async (tenant_id, campus_id, filters) => {
  const newFilters = { ...filters };
  
  // If filtering by class (integer ID), convert to UUID via class name lookup
  if (filters.class_id) {
    const res = await pool.query('SELECT class_name FROM classes WHERE class_id = $1', [filters.class_id]);
    if (res.rows.length > 0) {
      newFilters.class_id = toClassUUID(campus_id, res.rows[0].class_name);
    }
  }

  // If filtering by student_id (which might be username or integer ID), convert to UUID if needed
  if (filters.student_id) {
    // Check if it's a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(filters.student_id);
    if (!isUUID) {
       // Assume it is a username and convert it
       newFilters.student_id = toStudentUUID(filters.student_id);
    }
  }

  const dues = await feeModel.getStudentFeeDues(tenant_id, campus_id, newFilters);

  // Enrich with student details
  const q = `
    SELECT u.username, u.first_name, u.last_name, se.admission_number
    FROM users u
    JOIN student_enrollment se ON u.username = se.username
    WHERE u.tenant_id = $1
  `;
  const studentRes = await pool.query(q, [tenant_id]);
  
  const uuidMap = {};
  studentRes.rows.forEach(s => {
    const u = toStudentUUID(s.username);
    uuidMap[u] = s;
  });

  return dues.map(d => {
    const s = uuidMap[d.student_id];
    return {
      ...d,
      student_name: s ? `${s.first_name} ${s.last_name}` : 'Unknown Student',
      admission_number: s?.admission_number,
      username: s?.username
    };
  });
};

const getAllPayments = async (tenant_id, campus_id, filters) => {
  const payments = await feeModel.getAllPayments(tenant_id, campus_id, filters);

  // Enrich with student details (reverse UUID lookup)
  const q = `
    SELECT u.username, u.first_name, u.last_name, se.admission_number
    FROM users u
    JOIN student_enrollment se ON u.username = se.username
    WHERE u.tenant_id = $1
  `;
  const studentRes = await pool.query(q, [tenant_id]);
  
  const uuidMap = {};
  studentRes.rows.forEach(s => {
    const u = toStudentUUID(s.username);
    uuidMap[u] = s;
  });

  return payments.map(p => {
    const s = uuidMap[p.student_id];
    return {
      ...p,
      first_name: s?.first_name,
      last_name: s?.last_name,
      admission_number: s?.admission_number,
      student_name: s ? `${s.first_name} ${s.last_name}` : 'Unknown'
    };
  });
};

// ==================== COLLECTION LOGIC ====================
/**
 * Collect a payment and allocate to dues by oldest due date first
 * input: { tenant_id, student_username or student_id, total_amount_received, payment_method, collected_by, remarks }
 */
const collectPayment = async ({ tenant_id, student_username, student_id: inputStudentId, total_amount_received, payment_method, collected_by, remarks, allocations }) => {
  if (!tenant_id) throw new Error('tenant_id required');
  if (!total_amount_received || Number(total_amount_received) <= 0) throw new Error('total_amount_received must be > 0');
  if (!payment_method) throw new Error('payment_method required');

  const validMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Online'];
  if (!validMethods.includes(payment_method)) {
    throw new Error(`payment_method must be one of: ${validMethods.join(', ')}`);
  }

  const student_id = inputStudentId || toStudentUUID(student_username);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch unpaid dues to validate against
    const dues = await feeModel.getUnpaidDuesByStudent(client, student_id);
    const duesMap = new Map(dues.map(d => [String(d.due_id), d]));

    let amountLeft = Number(total_amount_received);

    // Create payment record now
    const payment = await feeModel.insertPayment(client, {
      tenant_id,
      student_id,
      amount_paid: Number(total_amount_received),
      payment_method,
      collected_by,
      remarks: remarks || null
    });

    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      // Manual Allocation Logic
      for (const alloc of allocations) {
        const { due_id, amount } = alloc;
        const amountToPay = Number(amount);

        if (amountToPay <= 0) continue;

        const due = duesMap.get(String(due_id));
        if (!due) {
           throw new Error(`Due item ${due_id} is not valid or already paid.`);
        }

        if (amountToPay > Number(due.balance_amount) + 0.01) { // 0.01 tolerance
             throw new Error(`Allocation amount ${amountToPay} exceeds balance ${due.balance_amount} for due ${due.fee_type_name || due_id}`);
        }

        // Reduce balance and mark paid if zero
        await feeModel.reduceDueBalance(client, due_id, amountToPay);

        // Create allocation record
        await feeModel.insertPaymentAllocation(client, {
          payment_id: payment.payment_id,
          due_id: due_id,
          amount_allocated: amountToPay
        });

        amountLeft -= amountToPay;
      }

      if (amountLeft < -0.01) {
         throw new Error(`Allocated amount exceeds total payment received by ${Math.abs(amountLeft)}`);
      }
      
    } else {
      // Existing Waterfall Allocation Logic
      if (!dues.length) {
         // It's possible they are paying in advance or just paying despite no dues? 
         // Original code threw error. Let's keep it but maybe relax if we want to support advance payments later.
         throw new Error('No unpaid dues for student');
      }

      for (const due of dues) {
        if (amountLeft <= 0) break;
        const allocate = Math.min(amountLeft, Number(due.balance_amount));
        if (allocate <= 0) continue;

        // Reduce balance and mark paid if zero
        await feeModel.reduceDueBalance(client, due.due_id, allocate);

        // Create allocation record
        await feeModel.insertPaymentAllocation(client, {
          payment_id: payment.payment_id,
          due_id: due.due_id,
          amount_allocated: allocate
        });

        amountLeft -= allocate;
      }
    }

    await client.query('COMMIT');

    return {
      payment,
      amount_unallocated: amountLeft,
      message: amountLeft > 0 ? 'Payment recorded with surplus amount' : 'Payment recorded and fully allocated'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in collectPayment:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createFeeStructure,
  assignFeesForEnrollment,
  assignFeesForEnrollmentWithClient,
  collectPayment,
  createFeeType,
  getFeeTypes,
  updateFeeType,
  deleteFeeType,
  getAllFeeStructures,
  deleteFeeStructure,
  getInstallmentsByStructure,
  getFeeStructureById,
  updateFeeStructure,
  generateDuesForClass,
  getStudentFeeDues,
  getAllPayments
};