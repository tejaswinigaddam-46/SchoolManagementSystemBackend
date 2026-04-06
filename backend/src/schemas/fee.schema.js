const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
}).unknown(true);

const tenantContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
}).unknown(true);

const userContextwithUserId = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
  userId: Joi.number().integer().min(1).required()
}).unknown(true);

const feeTypeBody = Joi.object({
  fee_type_name: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow(null, '').optional()
}).unknown(true);

const installmentSchema = Joi.object({
  installment_id: Joi.string().uuid().optional(),
  fee_structure_id: Joi.string().uuid().optional(),
  installment_name: Joi.string().trim().min(1).required(),
  due_date: Joi.date().iso().required(),
  amount: Joi.number().min(0).required(),
  penalty_amount: Joi.number().min(0).optional()
}).unknown(true);

const feeStructureBody = Joi.object({
  academic_year_id: Joi.number().integer().min(1).required(),
  class_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).optional(),
  class_name: Joi.string().trim().optional(),
  fee_type_id: Joi.string().uuid().required(),
  total_amount: Joi.number().min(0).required(),
  installments: Joi.array().items(installmentSchema).min(1).required()
}).or('class_id', 'class_name').unknown(true);

module.exports = {
  createFeeType: {
    user: userContext,
    body: feeTypeBody
  },
  getFeeTypes: {
    user: userContext,
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().optional()
    })
  },
  updateFeeType: {
    user: tenantContext,
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: feeTypeBody
  },
  deleteFeeType: {
    user: tenantContext,
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  createFeeStructure: {
    user: userContext,
    body: feeStructureBody
  },
  getAllFeeStructures: {
    user: tenantContext,
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().required()
    })
  },
  getFeeStructureById: {
    user: tenantContext,
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  updateFeeStructure: {
    user: userContext,
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: feeStructureBody.fork(['installments'], (schema) => schema.optional())
  },
  deleteFeeStructure: {
    user: tenantContext,
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  collectPayment: {
    user: userContextwithUserId,
    body: Joi.object({
      student_username: Joi.string().trim().optional(),
      student_id: Joi.string().uuid().optional(),
      total_amount_received: Joi.number().min(0).required(),
      payment_method: Joi.string().trim().required(),
      remarks: Joi.string().trim().allow(null, '').optional()
    }).or('student_username', 'student_id').unknown(true)
  },
  generateDuesForClass: {
    user: userContext,
    body: Joi.object({
      academic_year_id: Joi.number().integer().min(1).optional(),
      academicYearId: Joi.number().integer().min(1).optional(),
      class_id: Joi.number().integer().min(1).optional(),
      classId: Joi.number().integer().min(1).optional(),
      class_name: Joi.string().trim().optional(),
      className: Joi.string().trim().optional()
    }).unknown(true)
  },
  getStudentFeeDues: {
    user: userContext,
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().optional(),
      student_id: Joi.string().uuid().optional(),
      class_id: Joi.number().integer().min(1).optional(),
      academic_year_id: Joi.number().integer().min(1).optional()
    })
  },
  getAllPayments: {
    user: userContext,
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().optional(),
      student_id: Joi.string().uuid().optional()
    })
  }
};
