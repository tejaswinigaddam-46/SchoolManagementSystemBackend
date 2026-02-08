const { pool } = require('../config/database');

// Deterministic UUID helpers (computed in service layer typically)

const createFeeType = async (client, { tenant_id, campus_id, name, description }) => {
  const q = `
    INSERT INTO fee_types (tenant_id, campus_id, name, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const res = await client.query(q, [tenant_id, campus_id, name, description]);
  return res.rows[0];
};

const getFeeTypes = async (tenant_id, campus_id) => {
  const q = `
    SELECT 
      fee_type_id, 
      tenant_id, 
      campus_id, 
      name, 
      description, 
      created_at, 
      name as fee_type_name 
    FROM fee_types 
    WHERE tenant_id = $1 AND campus_id = $2 
    ORDER BY name ASC
  `;
  const res = await pool.query(q, [tenant_id, campus_id]);
  return res.rows;
};

const updateFeeType = async (client, fee_type_id, data) => {
  const { name, description } = data;
  const q = `
    UPDATE fee_types
    SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
    WHERE fee_type_id = $3
    RETURNING *
  `;
  const res = await client.query(q, [name, description, fee_type_id]);
  return res.rows[0];
};

const deleteFeeType = async (client, fee_type_id) => {
  const q = `DELETE FROM fee_types WHERE fee_type_id = $1 RETURNING *`;
  const res = await client.query(q, [fee_type_id]);
  return res.rows[0];
};

// ==================== FEE MODEL METHODS ====================

// Create fee_structure with installments in a single transaction (expects external client)
const createFeeStructureWithInstallments = async (client, data) => {
  const {
    tenant_id,
    campus_id,
    academic_year_id,
    class_id, // UUID
    fee_type_id, // UUID
    total_amount,
    installments // [{ installment_name, due_date, amount, penalty_amount? }]
  } = data;

  const insertStructureQ = `
    INSERT INTO fee_structures (
      tenant_id, campus_id, academic_year_id, class_id, fee_type_id, total_amount
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const fsRes = await client.query(insertStructureQ, [
    tenant_id,
    campus_id,
    academic_year_id,
    class_id,
    fee_type_id,
    total_amount
  ]);

  const fee_structure = fsRes.rows[0];

  const insertInstallmentQ = `
    INSERT INTO fee_installments (
      fee_structure_id, installment_name, due_date, amount, penalty_amount
    ) VALUES ($1, $2, $3, $4, COALESCE($5, 0))
    RETURNING *
  `;

  const installmentRows = [];
  for (const ins of installments || []) {
    const row = await client.query(insertInstallmentQ, [
      fee_structure.fee_structure_id,
      ins.installment_name,
      ins.due_date,
      ins.amount,
      ins.penalty_amount || 0
    ]);
    installmentRows.push(row.rows[0]);
  }

  return { fee_structure, installments: installmentRows };
};

const getFeeStructureForClass = async (campus_id, academic_year_id, class_id) => {
  const q = `
    SELECT * FROM fee_structures
    WHERE campus_id = $1 AND academic_year_id = $2 AND class_id = $3
    ORDER BY fee_type_id ASC
    LIMIT 1
  `;
  const r = await pool.query(q, [campus_id, academic_year_id, class_id]);
  return r.rows[0] || null;
};

const getFeeStructuresForClass = async (campus_id, academic_year_id, class_id) => {
  const q = `
    SELECT 
      fs.fee_structure_id,
      fs.tenant_id,
      fs.campus_id,
      fs.academic_year_id,
      fs.class_id,
      fs.fee_type_id,
      fs.total_amount,
      ft.name as fee_type_name 
    FROM fee_structures fs
    LEFT JOIN fee_types ft ON fs.fee_type_id = ft.fee_type_id
    WHERE fs.campus_id = $1 AND fs.academic_year_id = $2 AND fs.class_id = $3
    ORDER BY ft.name ASC
  `;
  const r = await pool.query(q, [campus_id, academic_year_id, class_id]);
  return r.rows;
};

const getAllFeeStructures = async (tenant_id, campus_id) => {
  const q = `
    SELECT 
      fs.fee_structure_id,
      fs.tenant_id,
      fs.campus_id,
      fs.academic_year_id,
      fs.class_id,
      fs.fee_type_id,
      fs.total_amount,
      ft.name as fee_type_name, 
      ay.year_name
    FROM fee_structures fs
    LEFT JOIN fee_types ft ON fs.fee_type_id = ft.fee_type_id
    LEFT JOIN academic_years ay ON fs.academic_year_id = ay.academic_year_id
    WHERE fs.tenant_id = $1 AND fs.campus_id = $2
    ORDER BY ay.year_name DESC
  `;
  const r = await pool.query(q, [tenant_id, campus_id]);
  return r.rows;
};

const getFeeStructureById = async (fee_structure_id) => {
  const q = `
    SELECT 
      fs.fee_structure_id,
      fs.tenant_id,
      fs.campus_id,
      fs.academic_year_id,
      fs.class_id,
      fs.fee_type_id,
      fs.total_amount,
      ft.name as fee_type_name, 
      ay.year_name,
      (SELECT json_agg(fi ORDER BY fi.due_date ASC, fi.installment_name ASC) 
       FROM fee_installments fi 
       WHERE fi.fee_structure_id = fs.fee_structure_id
      ) as installments
    FROM fee_structures fs
    LEFT JOIN fee_types ft ON fs.fee_type_id = ft.fee_type_id
    LEFT JOIN academic_years ay ON fs.academic_year_id = ay.academic_year_id
    WHERE fs.fee_structure_id = $1
  `;
  const r = await pool.query(q, [fee_structure_id]);
  return r.rows[0];
};

const updateFeeStructure = async (client, fee_structure_id, data) => {
  const {
    academic_year_id,
    class_id,
    fee_type_id,
    total_amount
  } = data;

  const q = `
    UPDATE fee_structures
    SET academic_year_id = $1, class_id = $2, fee_type_id = $3, total_amount = $4
    WHERE fee_structure_id = $5
    RETURNING *
  `;
  
  const res = await client.query(q, [
    academic_year_id,
    class_id,
    fee_type_id,
    total_amount,
    fee_structure_id
  ]);
  return res.rows[0];
};

const deleteInstallmentsByStructure = async (client, fee_structure_id) => {
  const q = `DELETE FROM fee_installments WHERE fee_structure_id = $1`;
  await client.query(q, [fee_structure_id]);
};

const deleteFeeStructure = async (client, fee_structure_id) => {
  const q = `DELETE FROM fee_structures WHERE fee_structure_id = $1 RETURNING *`;
  const r = await client.query(q, [fee_structure_id]);
  return r.rows[0];
};

const getInstallmentsByStructure = async (fee_structure_id) => {
  const q = `SELECT * FROM fee_installments WHERE fee_structure_id = $1 ORDER BY due_date ASC, installment_name ASC`;
  const r = await pool.query(q, [fee_structure_id]);
  return r.rows;
};

const upsertStudentDue = async (client, { student_id, installment_id, amount, discount_amount = 0 }) => {
  const balance = Number(amount) - Number(discount_amount || 0);
  const q = `
    INSERT INTO student_fee_dues (student_id, installment_id, discount_amount, is_paid, balance_amount)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (student_id, installment_id)
    DO UPDATE SET
      discount_amount = EXCLUDED.discount_amount,
      balance_amount = EXCLUDED.balance_amount,
      is_paid = EXCLUDED.is_paid
    RETURNING *
  `;
  const r = await client.query(q, [student_id, installment_id, discount_amount || 0, balance <= 0, Math.max(balance, 0)]);
  return r.rows[0];
};

const getUnpaidDuesByStudent = async (client, student_id) => {
  const q = `
    SELECT d.*, i.due_date, i.amount AS installment_amount
    FROM student_fee_dues d
    JOIN fee_installments i ON d.installment_id = i.installment_id
    WHERE d.student_id = $1 AND d.is_paid = FALSE AND d.balance_amount > 0
    ORDER BY i.due_date ASC, i.installment_name ASC
  `;
  const r = await client.query(q, [student_id]);
  return r.rows;
};

const reduceDueBalance = async (client, due_id, amountToReduce) => {
  const q = `
    UPDATE student_fee_dues
    SET balance_amount = GREATEST(balance_amount - $2, 0),
        is_paid = CASE WHEN balance_amount - $2 <= 0 THEN TRUE ELSE is_paid END
    WHERE due_id = $1
    RETURNING *
  `;
  const r = await client.query(q, [due_id, amountToReduce]);
  return r.rows[0];
};

const insertPayment = async (client, { tenant_id, student_id, amount_paid, payment_method, collected_by, remarks = null }) => {
  const q = `
    INSERT INTO fee_payments (tenant_id, student_id, amount_paid, payment_method, collected_by, remarks)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const r = await client.query(q, [tenant_id, student_id, amount_paid, payment_method, collected_by, remarks]);
  return r.rows[0];
};

const insertPaymentAllocation = async (client, { payment_id, due_id, amount_allocated }) => {
  const q = `
    INSERT INTO payment_allocations (payment_id, due_id, amount_allocated)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const r = await client.query(q, [payment_id, due_id, amount_allocated]);
  return r.rows[0];
};

const getStudentFeeDues = async (tenant_id, campus_id, filters) => {
  let q = `
    SELECT 
      d.due_id,
      d.student_id,
      d.installment_id,
      d.discount_amount,
      d.is_paid,
      d.balance_amount,
      ft.name as fee_type_name, 
      fi.installment_name, 
      fi.due_date, 
      fi.amount
    FROM student_fee_dues d
    JOIN fee_installments fi ON d.installment_id = fi.installment_id
    JOIN fee_structures fs ON fi.fee_structure_id = fs.fee_structure_id
    JOIN fee_types ft ON fs.fee_type_id = ft.fee_type_id
    WHERE fs.tenant_id = $1 AND fs.campus_id = $2
  `;
  const params = [tenant_id, campus_id];

  if (filters.student_id) {
    q += ` AND d.student_id = $${params.length + 1}`;
    params.push(filters.student_id);
  }
  
  if (filters.class_id) {
    q += ` AND fs.class_id = $${params.length + 1}`;
    params.push(filters.class_id);
  }

  if (filters.academic_year_id) {
    q += ` AND fs.academic_year_id = $${params.length + 1}`;
    params.push(filters.academic_year_id);
  }

  q += ` ORDER BY fi.due_date ASC`;

  const res = await pool.query(q, params);
  return res.rows;
};

const getAllPayments = async (tenant_id, campus_id, filters) => {
  let q = `
    SELECT p.*
    FROM fee_payments p
    WHERE p.tenant_id = $1
  `;
  const params = [tenant_id];

  if (filters.student_id) {
    q += ` AND p.student_id = $${params.length + 1}`;
    params.push(filters.student_id);
  }

  q += ` ORDER BY p.payment_date DESC`;

  const res = await pool.query(q, params);
  return res.rows;
};

module.exports = {
  createFeeStructureWithInstallments,
  getFeeStructureForClass,
  getFeeStructuresForClass,
  getInstallmentsByStructure,
  upsertStudentDue,
  getUnpaidDuesByStudent,
  reduceDueBalance,
  insertPayment,
  insertPaymentAllocation,
  getAllFeeStructures,
  createFeeType,
  getFeeTypes,
  updateFeeType,
  deleteFeeType,
  deleteFeeStructure,
  getFeeStructureById,
  updateFeeStructure,
  deleteInstallmentsByStructure,
  getStudentFeeDues,
  getAllPayments
};