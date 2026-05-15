const Joi = require('joi');

const normalizePhone = (value) => value.replace(/[\s()-]/g, '');
const phonePattern = /^\+?\d{7,15}$/;

const phoneValue = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalized = normalizePhone(value);
    if (!phonePattern.test(normalized)) {
      return helpers.error('string.pattern.base');
    }
    return value;
  });

const demoRequestBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  schoolName: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string().trim().email().required(),
  phone: phoneValue.required(),
}).unknown(true);

module.exports = {
  submitDemoRequest: {
    body: demoRequestBody,
  },
};
