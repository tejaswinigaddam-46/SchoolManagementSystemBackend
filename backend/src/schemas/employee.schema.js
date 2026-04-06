const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
  role: Joi.string().trim().optional()
}).unknown(true);

const userContextWithRole = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
  role: Joi.string().trim().min(1).required()
}).unknown(true);

const params = {
  username: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_.-]+$/).required(),
  employeeId: Joi.string().trim().min(3).max(20).pattern(/^[a-zA-Z0-9-]+$/).required(),
  employmentId: Joi.string().trim().min(3).max(20).pattern(/^[a-zA-Z0-9-]+$/).required(),
  campusId: Joi.string().trim().uuid().required(),
  department: Joi.string().trim().min(1).required()
};

const createEmployeeBody = Joi.object({
  user: Joi.object({
    first_name: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s'-]+$/).required(),
    middle_name: Joi.string().trim().allow(null, '').optional(),
    last_name: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s'-]+$/).required(),
    phone_number: Joi.string().trim().allow(null, '').optional(),
    date_of_birth: Joi.date().iso().required(),
    role: Joi.string().trim().valid('Employee', 'Admin').required()
  }).required(),
  contact: Joi.object({
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).allow(null, '').optional(),
    alt_phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).allow(null, '').optional(),
    current_address: Joi.string().trim().min(10).max(255).allow(null, '').optional(),
    city: Joi.string().trim().min(2).max(100).pattern(/^[a-zA-Z\s'-]+$/).allow(null, '').optional(),
    state: Joi.string().trim().min(2).max(100).pattern(/^[a-zA-Z\s'-]+$/).allow(null, '').optional(),
    pincode: Joi.string().trim().pattern(/^[0-9]{5,10}$/).allow(null, '').optional(),
    country: Joi.string().trim().min(2).max(100).pattern(/^[a-zA-Z\s'-]+$/).allow(null, '').optional(),
    permanent_address: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_name: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_phone: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_relation: Joi.string().trim().valid('Mother', 'Father', 'Guardian', 'Other').allow(null, '').optional()
  }).required(),
  employment: Joi.object({
    employee_id: Joi.string().trim().min(3).max(20).pattern(/^[a-zA-Z0-9-]+$/).required(),
    designation: Joi.string().trim().valid(
      'Principal','Vice-Principal','Headmaster','Administrator',
      'Senior Teacher','Teacher','Assistant Teacher','Substitute Teacher',
      'Librarian','Lab Assistant','IT Support',
      'Accountant','Office Clerk','Receptionist',
      'Security Guard','Cleaner','Driver','Nurse'
    ).required(),
    department: Joi.string().trim().valid(
      'Academics','Mathematics','Science','English','Social Studies','Languages','Physical Education','Telugu','Hindi',
      'Administration','Admissions','Accounts','Human Resources',
      'IT Support','Library','Transport','Hostel','Security','Maintenance'
    ).required(),
    joining_date: Joi.date().iso().required(),
    salary: Joi.number().min(0).max(10000000).optional(),
    employment_type: Joi.string().trim().valid('Full-time','Part-time','Contract','Temporary','Intern').optional(),
    status: Joi.string().trim().valid('Active','On Leave','Inactive','Terminated').optional(),
    transport_details: Joi.string().trim().allow(null, '').optional(),
    hostel_details: Joi.string().trim().allow(null, '').optional()
  }).required(),
  personal: Joi.object({
    gender: Joi.string().trim().valid('Male','Female','Other').allow(null, '').optional(),
    marital_status: Joi.string().trim().valid('Single','Married','Divorced','Widowed','Separated').allow(null, '').optional(),
    nationality: Joi.string().trim().allow(null, '').optional(),
    religion: Joi.string().trim().allow(null, '').optional(),
    caste: Joi.string().trim().allow(null, '').optional(),
    category: Joi.string().trim().valid('General','OBC','SC','ST','EWS').allow(null, '').optional(),
    blood_group: Joi.string().trim().valid('A+','A-','B+','B-','AB+','AB-','O+','O-').allow(null, '').optional(),
    height_cm: Joi.number().integer().min(100).max(250).optional(),
    weight_kg: Joi.number().min(30).max(200).optional(),
    medical_conditions: Joi.string().trim().allow(null, '').optional(),
    allergies: Joi.string().trim().allow(null, '').optional(),
    occupation: Joi.string().trim().allow(null, '').optional(),
    income: Joi.number().optional()
  }).optional()
}).required().unknown(true);

const updateEmployeeBody = Joi.object({
  user: Joi.object({
    first_name: Joi.string().trim().min(1).optional(),
    middle_name: Joi.string().trim().allow(null, '').optional(),
    last_name: Joi.string().trim().min(1).optional(),
    phone_number: Joi.string().trim().allow(null, '').optional(),
    date_of_birth: Joi.date().iso().optional(),
    role: Joi.string().trim().min(1).optional()
  }).optional(),
  contact: Joi.object({
    email: Joi.string().trim().email().optional(),
    phone: Joi.string().trim().allow(null, '').optional(),
    alt_phone: Joi.string().trim().allow(null, '').optional(),
    current_address: Joi.string().trim().allow(null, '').optional(),
    city: Joi.string().trim().allow(null, '').optional(),
    state: Joi.string().trim().allow(null, '').optional(),
    pincode: Joi.string().trim().allow(null, '').optional(),
    country: Joi.string().trim().allow(null, '').optional(),
    permanent_address: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_name: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_phone: Joi.string().trim().allow(null, '').optional(),
    emergency_contact_relation: Joi.string().trim().allow(null, '').optional()
  }).optional(),
  employment: Joi.object({
    employee_id: Joi.string().trim().min(1).optional(),
    designation: Joi.string().trim().min(1).optional(),
    department: Joi.string().trim().min(1).optional(),
    joining_date: Joi.date().iso().optional(),
    salary: Joi.number().optional(),
    employment_type: Joi.string().trim().min(1).optional(),
    status: Joi.string().trim().min(1).optional(),
    transport_details: Joi.string().trim().allow(null, '').optional(),
    hostel_details: Joi.string().trim().allow(null, '').optional()
  }).optional(),
  personal: Joi.object({
    gender: Joi.string().trim().valid('Male','Female','Other').allow(null, '').optional(),
    marital_status: Joi.string().trim().valid('Single','Married','Divorced','Widowed','Separated').allow(null, '').optional(),
    nationality: Joi.string().trim().allow(null, '').optional(),
    religion: Joi.string().trim().allow(null, '').optional(),
    caste: Joi.string().trim().allow(null, '').optional(),
    category: Joi.string().trim().valid('General','OBC','SC','ST','EWS').allow(null, '').optional(),
    blood_group: Joi.string().trim().valid('A+','A-','B+','B-','AB+','AB-','O+','O-').allow(null, '').optional(),
    height_cm: Joi.number().integer().min(100).max(250).optional(),
    weight_kg: Joi.number().min(30).max(200).optional(),
    medical_conditions: Joi.string().trim().allow(null, '').optional(),
    allergies: Joi.string().trim().allow(null, '').optional(),
    occupation: Joi.string().trim().allow(null, '').optional(),
    income: Joi.number().optional(),
    identification_type: Joi.string().trim().valid('Aadhar','PAN','Passport','Voter ID','Driving License').allow(null, '').optional(),
    identification_number: Joi.string().trim().min(5).max(50).allow(null, '').optional(),
    special_needs: Joi.string().trim().max(500).allow(null, '').optional()
  }).optional()
}).or('user', 'contact', 'employment', 'personal').unknown(true);

module.exports = {
  getAllEmployees: {
    user: userContext,
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().trim().max(100).allow('').optional(),
      department: Joi.string().trim().valid(
        'Academics','Mathematics','Science','English','Social Studies','Languages','Physical Education',
        'Administration','Admissions','Accounts','Human Resources',
        'IT Support','Library','Transport','Hostel','Security','Maintenance'
      ).optional(),
      designation: Joi.string().trim().valid(
        'Principal','Vice-Principal','Headmaster','Administrator',
        'Senior Teacher','Teacher','Assistant Teacher','Substitute Teacher',
        'Librarian','Lab Assistant','IT Support',
        'Accountant','Office Clerk','Receptionist',
        'Security Guard','Cleaner','Driver','Nurse'
      ).optional(),
      status: Joi.string().trim().valid('Active','On Leave','Inactive','Terminated').optional(),
      employment_type: Joi.string().trim().valid('Full-time','Part-time','Contract','Temporary','Intern').optional(),
      campus_id: Joi.string().trim().uuid().optional(),
      role: Joi.string().trim().allow('').optional()
    })
  },
  createEmployee: {
    user: userContext,
    body: createEmployeeBody
  },
  getEmployeeStatistics: {
    user: userContext,
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().optional()
    }).optional()
  },
  getEnumValues: {
    user: userContext
  },
  getFilterOptions: {
    user: userContext
  },
  checkUsernameAvailability: {
    user: userContext,
    query: Joi.object({
      username: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_.-]+$/).required()
    })
  },
  checkEmployeeIdAvailability: {
    user: userContext,
    query: Joi.object({
      employee_id: Joi.string().trim().min(3).max(20).pattern(/^[a-zA-Z0-9-]+$/).required(),
      campus_id: Joi.string().trim().uuid().required()
    })
  },
  getEmployeesByCampus: {
    user: userContextWithRole,
    params: Joi.object({
      campusId: params.campusId
    })
  },
  getEmployeesByDepartment: {
    user: userContextWithRole,
    params: Joi.object({
      department: params.department
    }),
    query: Joi.object({
      campus_id: Joi.string().trim().uuid().optional()
    }).optional()
  },
  getEmployeeByUsername: {
    user: userContextWithRole,
    params: Joi.object({
      username: params.username
    })
  },
  getEmployeeByEmployeeId: {
    user: userContext,
    params: Joi.object({
      employeeId: params.employeeId
    })
  },
  getEmployeeByEmploymentId: {
    user: userContext,
    params: Joi.object({
      employmentId: params.employmentId
    })
  },
  getEmployeeForEdit: {
    user: userContext,
    params: Joi.object({
      username: params.username
    })
  },
  updateEmployee: {
    user: userContext,
    params: Joi.object({
      username: params.username
    }),
    body: updateEmployeeBody
  },
  deleteEmployee: {
    user: userContext,
    params: Joi.object({
      username: params.username
    })
  }
};
