const Joi = require('joi');

const currentYear = new Date().getFullYear();

const normalizePhone = (value) => value.replace(/[\s-]/g, '');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
  username: Joi.string().trim().min(1).invalid('undefined').required()
}).unknown(true);

const subdomainPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const adminPhonePattern = /^(\+91|91)?[6789]\d{9}$/;
const tenantPhonePattern = /^(\+91|91)?[0-9]{10,11}$/;
const campusPhonePattern = /^([+]?\d{1,3}[\s-]?)?\d{10,11}$/;
const logoUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i;
const websiteUrlPattern = /^https?:\/\/.+\..+/;

const normalizedPhoneString = (pattern) =>
  Joi.string()
    .trim()
    .custom((value, helpers) => {
      const normalized = normalizePhone(value);
      if (!pattern.test(normalized)) {
        return helpers.error('string.pattern.base');
      }
      return value;
    });

const params = {
  tenantId: Joi.string().trim().uuid().required(),
  subdomain: Joi.string().trim().lowercase().min(2).max(63).pattern(subdomainPattern).required(),
  email: Joi.string().trim().email().required()
};

const registerTenantBody = Joi.object({
  tenantName: Joi.string().trim().min(1).required(),
  subdomain: params.subdomain,
  tenantPhone: normalizedPhoneString(tenantPhonePattern).required(),
  yearFounded: Joi.number().integer().min(1800).max(currentYear).required(),
  logoUrl: Joi.string().trim().pattern(logoUrlPattern).required(),
  websiteUrl: Joi.string().trim().pattern(websiteUrlPattern).required(),
  adminFirstName: Joi.string().trim().min(1).required(),
  adminMiddleName: Joi.string().trim().allow('', null).optional(),
  adminLastName: Joi.string().trim().min(1).required(),
  adminPhone: normalizedPhoneString(adminPhonePattern).required(),
  adminDOB: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  campusName: Joi.string().trim().min(1).required(),
  campusAddress: Joi.string().trim().min(1).required(),
  campusPhone: normalizedPhoneString(campusPhonePattern).allow('', null).optional(),
  campusEmail: Joi.string().trim().email().allow('', null).optional(),
  campusYearEstablished: Joi.number().integer().min(1800).max(currentYear).allow(null).optional(),
  campusNoOfFloors: Joi.number().integer().min(1).max(200).required()
}).unknown(true);

const updateTenantBody = Joi.object({
  tenant_name: Joi.string().trim().min(1).optional(),
  year_founded: Joi.number().integer().min(1800).max(currentYear).optional(),
  logo_url: Joi.string().trim().pattern(logoUrlPattern).optional(),
  website: Joi.string().trim().pattern(/^https?:\/\/.+/).optional()
}).min(1).unknown(true);

module.exports = {
  registerTenant: {
    body: registerTenantBody
  },
  getTenantBySubdomain: {
    params: Joi.object({ subdomain: params.subdomain })
  },
  checkSubdomainAvailability: {
    params: Joi.object({ subdomain: params.subdomain })
  },
  checkEmailAvailability: {
    params: Joi.object({ email: params.email })
  },
  getAllTenants: {
    user: userContext
  },
  getTenantById: {
    user: userContext,
    params: Joi.object({ tenantId: params.tenantId })
  },
  updateTenant: {
    user: userContext,
    params: Joi.object({ tenantId: params.tenantId }),
    body: updateTenantBody
  },
  getTenantStatistics: {
    user: userContext,
    params: Joi.object({ tenantId: params.tenantId })
  }
};
