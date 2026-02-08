const { body } = require('express-validator');

/**
 * Validation rules for creating a user.
 */
const createUserValidationRules = [
    body('role').isString().notEmpty().withMessage('Role is required and must be a string.'),
    body('first_name').isString().notEmpty().withMessage('First name is required and must be a string.'),
    body('middle_name').optional().isString().withMessage('Middle name must be a string.'),
    body('last_name').isString().notEmpty().withMessage('Last name is required and must be a string.'),
    body('phone_number')
        .optional()
        .matches(/^\+91[6-9]\d{9}$/)
        .withMessage('Phone number must be a valid Indian number starting with +91.'),
    body('date_of_birth')
        .isISO8601()
        .withMessage('Date of birth must be in YYYY-MM-DD format.')
        .custom((value) => {
            const dob = new Date(value);
            const today = new Date();
            if (dob > today) {
                throw new Error('Date of birth cannot be in the future.');
            }
            return true;
        }),
    body('tenant_id').isUUID().withMessage('Tenant ID must be a valid UUID.')
];

module.exports = {
    createUserValidationRules
};