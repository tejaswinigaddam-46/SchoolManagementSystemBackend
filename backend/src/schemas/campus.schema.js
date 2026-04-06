const Joi = require('joi');

const currentYear = new Date().getFullYear();

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required()
}).unknown(true);

const params = {
  id: Joi.string().uuid().required()
};

const indianPhoneNumber = Joi.string()
  .trim()
  .min(1)
  .required()
  .custom((value, helpers) => {
    const normalized = value.replace(/[\s-]/g, '');
    if (!/^(\+91|91)?[0-9]{10,11}$/.test(normalized)) {
      return helpers.error('string.pattern.base');
    }
    return value;
  });

const campusPayload = {
  campus_name: Joi.string().trim().min(1).required(),
  address: Joi.string().trim().min(1).required(),
  phone_number: indianPhoneNumber,
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  is_main_campus: Joi.boolean().required(),
  year_established: Joi.number().integer().min(1500).max(currentYear).required(),
  no_of_floors: Joi.number().integer().min(1).max(200).required()
};

module.exports = {
  getAllCampuses: {
    user: userContext
  },
  registerCampus: {
    user: userContext,
    body: Joi.object(campusPayload)
  },
  getCampusById: {
    user: userContext,
    params: Joi.object({
      id: params.id
    })
  },
  updateCampus: {
    user: userContext,
    params: Joi.object({
      id: params.id
    }),
    body: Joi.object(campusPayload)
  },
  deleteCampus: {
    user: userContext,
    params: Joi.object({
      id: params.id
    })
  }
};
