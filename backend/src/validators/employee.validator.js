const { body, query, param } = require('express-validator');

// Common validation patterns
const usernamePattern = /^[a-zA-Z0-9_.-]+$/;
const phonePattern = /^\+?[1-9]\d{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const employeeIdPattern = /^[a-zA-Z0-9-]+$/;
const namePattern = /^[a-zA-Z\s'-]+$/;
const addressPattern = /^[a-zA-Z0-9\s,.-]+$/;
const pinCodePattern = /^[0-9]{5,10}$/;

// ==================== EMPLOYEE VALIDATION RULES ====================

/**
 * Validation rules for creating an employee
 * Validates all required fields across user, contact, employment, and personal sections
 */
const createEmployeeValidation = [
    // User Information Section
    // Username is auto-generated on backend, so it's optional in request
    body('user.username')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(usernamePattern)
        .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores'),

    body('user.first_name')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('First name can only contain letters, spaces, apostrophes, and hyphens'),

    body('user.last_name')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Last name can only contain letters, spaces, apostrophes, and hyphens'),

    body('user.date_of_birth')
        .notEmpty()
        .withMessage('Date of birth is required')
        .isISO8601()
        .withMessage('Date of birth must be a valid date in YYYY-MM-DD format')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 18 || age > 80) {
                throw new Error('Employee must be between 18 and 80 years old');
            }
            
            if (birthDate > today) {
                throw new Error('Date of birth cannot be in the future');
            }
            
            return true;
        }),

    body('user.role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['Employee', 'Manager', 'Admin'])
        .withMessage('Role must be Employee, Manager, or Admin'),

    // Contact Details Section
    body('contact.email')
        .notEmpty()
        .withMessage('Email is required')
        .matches(emailPattern)
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('contact.phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(phonePattern)
        .withMessage('Please provide a valid phone number'),

    body('contact.alt_phone')
        .optional({ nullable: true, checkFalsy: true })
        .matches(phonePattern)
        .withMessage('Please provide a valid alternate phone number'),

    body('contact.current_address')
        .notEmpty()
        .withMessage('Address is required')
        .isLength({ min: 10, max: 255 })
        .withMessage('Address must be between 10 and 255 characters')
        .matches(addressPattern)
        .withMessage('Address contains invalid characters'),

    body('contact.city')
        .notEmpty()
        .withMessage('City is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('City can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.state')
        .notEmpty()
        .withMessage('State is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('State can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.pincode')
        .notEmpty()
        .withMessage('PIN code is required')
        .matches(pinCodePattern)
        .withMessage('PIN code must be 5-10 digits'),

    body('contact.country')
        .notEmpty()
        .withMessage('Country is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Country can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.permanent_address')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 10, max: 255 })
        .withMessage('Permanent address must be between 10 and 255 characters')
        .matches(addressPattern)
        .withMessage('Permanent address contains invalid characters'),

    // Emergency Contact Fields (Optional)
    body('contact.emergency_contact_name')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('Emergency contact name must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Emergency contact name can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.emergency_contact_phone')
        .optional({ nullable: true, checkFalsy: true })
        .matches(phonePattern)
        .withMessage('Please provide a valid emergency contact phone number'),

    body('contact.emergency_contact_relation')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Mother', 'Father', 'Guardian', 'Other'])
        .withMessage('Emergency contact relation must be Mother, Father, Guardian, or Other'),

    // Employment Details Section
    body('employment.employee_id')
        .notEmpty()
        .withMessage('Employee ID is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters')
        .matches(employeeIdPattern)
        .withMessage('Employee ID can only contain letters, numbers, and hyphens'),

    body('employment.department')
        .notEmpty()
        .withMessage('Department is required')
        .isIn([
            // Academic Departments
            'Academics', 'Mathematics', 'Science', 'English', 'Social Studies', 'Languages', 'Physical Education', 'Telugu', 'Hindi',
            // Administrative Departments
            'Administration', 'Admissions', 'Accounts', 'Human Resources',
            // Support Departments
            'IT Support', 'Library', 'Transport', 'Hostel', 'Security', 'Maintenance'
        ])
        .withMessage('Invalid department selected'),

    body('employment.designation')
        .notEmpty()
        .withMessage('Designation is required')
        .isIn([
            // Administrative Roles
            'Principal', 'Vice-Principal', 'Headmaster', 'Administrator',
            // Teaching Roles
            'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Substitute Teacher',
            // Support Staff
            'Librarian', 'Lab Assistant', 'IT Support',
            // Office Staff
            'Accountant', 'Office Clerk', 'Receptionist',
            // Other Staff
            'Security Guard', 'Cleaner', 'Driver', 'Nurse'
        ])
        .withMessage('Invalid designation selected'),

    body('employment.employment_type')
        .notEmpty()
        .withMessage('Employment type is required')
        .isIn(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'])
        .withMessage('Employment type must be Full-time, Part-time, Contract, Temporary, or Intern'),

    body('employment.joining_date')
        .notEmpty()
        .withMessage('Date of joining is required')
        .isISO8601()
        .withMessage('Date of joining must be a valid date in YYYY-MM-DD format')
        .custom((value) => {
            const joinDate = new Date(value);
            const today = new Date();
            
            if (joinDate > today) {
                throw new Error('Date of joining cannot be in the future');
            }
            
            // Check if joining date is not more than 50 years ago
            const fiftyYearsAgo = new Date();
            fiftyYearsAgo.setFullYear(today.getFullYear() - 50);
            
            if (joinDate < fiftyYearsAgo) {
                throw new Error('Date of joining cannot be more than 50 years ago');
            }
            
            return true;
        }),

    body('employment.salary')
        .notEmpty()
        .withMessage('Salary is required')
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number')
        .custom((value) => {
            if (value > 10000000) { // 1 crore limit
                throw new Error('Salary cannot exceed 1,00,00,000');
            }
            return true;
        }),

    body('employment.status')
        .notEmpty()
        .withMessage('Employment status is required')
        .isIn(['Active', 'On Leave', 'Inactive', 'Terminated'])
        .withMessage('Status must be Active, On Leave, Inactive, or Terminated'),

    body('employment.transport_details')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 255 })
        .withMessage('Transport details must be between 2 and 255 characters'),

    body('employment.hostel_details')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 255 })
        .withMessage('Hostel details must be between 2 and 255 characters'),

    // Personal Details Section
    body('personal.gender')
        .notEmpty()
        .withMessage('Gender is required')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),

    body('personal.nationality')
        .notEmpty()
        .withMessage('Nationality is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Nationality can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.religion')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Religion must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Religion can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.caste')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Caste must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Caste can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.category')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['General', 'OBC', 'SC', 'ST', 'EWS'])
        .withMessage('Category must be General, OBC, SC, ST, or EWS'),

    body('personal.blood_group')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-'),

    body('personal.height_cm')
        .optional({ nullable: true })
        .isInt({ min: 100, max: 250 })
        .withMessage('Height must be between 100 and 250 centimeters'),

    body('personal.weight_kg')
        .optional({ nullable: true })
        .isFloat({ min: 30, max: 200 })
        .withMessage('Weight must be between 30 and 200 kilograms'),

    body('personal.medical_conditions')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 500 })
        .withMessage('Medical conditions cannot exceed 500 characters'),

    body('personal.allergies')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 500 })
        .withMessage('Allergies cannot exceed 500 characters'),

    body('personal.occupation')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('Occupation must be between 2 and 100 characters'),

    body('personal.income')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Income must be a positive number')
];

/**
 * Validation rules for updating an employee
 * Similar to create but allows partial updates
 */
const updateEmployeeValidation = [
    // User Information Section - All optional for updates
    body('user.first_name')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('First name can only contain letters, spaces, apostrophes, and hyphens'),

    body('user.last_name')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Last name can only contain letters, spaces, apostrophes, and hyphens'),

    body('user.date_of_birth')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Date of birth must be a valid date in YYYY-MM-DD format')
        .custom((value) => {
            if (!value) return true;
            
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 18 || age > 80) {
                throw new Error('Employee must be between 18 and 80 years old');
            }
            
            if (birthDate > today) {
                throw new Error('Date of birth cannot be in the future');
            }
            
            return true;
        }),

    body('user.gender')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),

    body('user.role')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Employee', 'Manager', 'Admin'])
        .withMessage('Role must be Employee, Manager, or Admin'),

    // Contact Details Section
    body('contact.email')
        .optional({ nullable: true, checkFalsy: true })
        .matches(emailPattern)
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('contact.phone')
        .optional({ nullable: true, checkFalsy: true })
        .matches(phonePattern)
        .withMessage('Please provide a valid phone number'),

    body('contact.alt_phone')
        .optional({ nullable: true, checkFalsy: true })
        .matches(phonePattern)
        .withMessage('Please provide a valid alternate phone number'),

    body('contact.current_address')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 10, max: 255 })
        .withMessage('Address must be between 10 and 255 characters')
        .matches(addressPattern)
        .withMessage('Address contains invalid characters'),

    body('contact.city')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('City can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.state')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('State can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.pincode')
        .optional({ nullable: true, checkFalsy: true })
        .matches(pinCodePattern)
        .withMessage('PIN code must be 5-10 digits'),

    body('contact.country')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Country can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.permanent_address')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 10, max: 255 })
        .withMessage('Permanent address must be between 10 and 255 characters')
        .matches(addressPattern)
        .withMessage('Permanent address contains invalid characters'),

    // Emergency Contact Fields (Optional)
    body('contact.emergency_contact_name')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('Emergency contact name must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Emergency contact name can only contain letters, spaces, apostrophes, and hyphens'),

    body('contact.emergency_contact_phone')
        .optional({ nullable: true, checkFalsy: true })
        .matches(phonePattern)
        .withMessage('Please provide a valid emergency contact phone number'),

    body('contact.emergency_contact_relation')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Mother', 'Father', 'Guardian', 'Other'])
        .withMessage('Emergency contact relation must be Mother, Father, Guardian, or Other'),

    // Employment Details Section
    body('employment.employee_id')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters')
        .matches(employeeIdPattern)
        .withMessage('Employee ID can only contain letters, numbers, and hyphens'),

    body('employment.department')
        .optional({ nullable: true, checkFalsy: true })
        .isIn([
            // Academic Departments
            'Academics', 'Mathematics', 'Science', 'English', 'Social Studies', 'Languages', 'Physical Education', 'Telugu', 'Hindi',
            // Administrative Departments
            'Administration', 'Admissions', 'Accounts', 'Human Resources',
            // Support Departments
            'IT Support', 'Library', 'Transport', 'Hostel', 'Security', 'Maintenance'
        ])
        .withMessage('Invalid department selected'),

    body('employment.designation')
        .optional({ nullable: true, checkFalsy: true })
        .isIn([
            // Administrative Roles
            'Principal', 'Vice-Principal', 'Headmaster', 'Administrator',
            // Teaching Roles
            'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Substitute Teacher',
            // Support Staff
            'Librarian', 'Lab Assistant', 'IT Support',
            // Office Staff
            'Accountant', 'Office Clerk', 'Receptionist',
            // Other Staff
            'Security Guard', 'Cleaner', 'Driver', 'Nurse'
        ])
        .withMessage('Invalid designation selected'),

    body('employment.employment_type')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'])
        .withMessage('Employment type must be Full-time, Part-time, Contract, Temporary, or Intern'),

    body('employment.joining_date')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Date of joining must be a valid date in YYYY-MM-DD format')
        .custom((value) => {
            if (!value) return true;
            
            const joinDate = new Date(value);
            const today = new Date();
            
            if (joinDate > today) {
                throw new Error('Date of joining cannot be in the future');
            }
            
            // Check if joining date is not more than 50 years ago
            const fiftyYearsAgo = new Date();
            fiftyYearsAgo.setFullYear(today.getFullYear() - 50);
            
            if (joinDate < fiftyYearsAgo) {
                throw new Error('Date of joining cannot be more than 50 years ago');
            }
            
            return true;
        }),

    body('employment.salary')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number')
        .custom((value) => {
            if (value && value > 10000000) { // 1 crore limit
                throw new Error('Salary cannot exceed 1,00,00,000');
            }
            return true;
        }),

    body('employment.status')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Active', 'On Leave', 'Inactive', 'Terminated'])
        .withMessage('Status must be Active, On Leave, Inactive, or Terminated'),

    // Personal Details Section
    body('personal.marital_status')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Single', 'Married', 'Divorced', 'Widowed', 'Separated'])
        .withMessage('Marital status must be Single, Married, Divorced, Widowed, or Separated'),

    body('personal.nationality')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters')
        .matches(namePattern)
        .withMessage('Nationality can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.religion')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Religion must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Religion can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.caste')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Caste must be between 2 and 50 characters')
        .matches(namePattern)
        .withMessage('Caste can only contain letters, spaces, apostrophes, and hyphens'),

    body('personal.blood_group')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-'),

    body('personal.identification_type')
        .optional({ nullable: true, checkFalsy: true })
        .isIn(['Aadhar', 'PAN', 'Passport', 'Voter ID', 'Driving License'])
        .withMessage('Identification type must be Aadhar, PAN, Passport, Voter ID, or Driving License'),

    body('personal.identification_number')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 5, max: 50 })
        .withMessage('Identification number must be between 5 and 50 characters'),

    body('personal.medical_conditions')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 500 })
        .withMessage('Medical conditions cannot exceed 500 characters'),

    body('personal.allergies')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 500 })
        .withMessage('Allergies cannot exceed 500 characters'),

    body('personal.special_needs')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 500 })
        .withMessage('Special needs cannot exceed 500 characters')
];

/**
 * Validation rules for username parameter
 */
const usernameParamValidation = [
    param('username')
        .notEmpty()
        .withMessage('Username parameter is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(usernamePattern)
        .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores')
];

/**
 * Validation rules for employee ID parameter
 */
const employeeIdParamValidation = [
    param('employeeId')
        .notEmpty()
        .withMessage('Employee ID parameter is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters')
        .matches(employeeIdPattern)
        .withMessage('Employee ID can only contain letters, numbers, and hyphens')
];

/**
 * Validation rules for employment ID parameter (alias for employeeId)
 */
const employmentIdParamValidation = [
    param('employmentId')
        .notEmpty()
        .withMessage('Employment ID parameter is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employment ID must be between 3 and 20 characters')
        .matches(employeeIdPattern)
        .withMessage('Employment ID can only contain letters, numbers, and hyphens')
];

/**
 * Validation rules for campus ID parameter
 */
const campusIdParamValidation = [
    param('campusId')
        .notEmpty()
        .withMessage('Campus ID parameter is required')
        .isUUID(4)
        .withMessage('Campus ID must be a valid UUID')
];

/**
 * Validation rules for department parameter
 */
const departmentParamValidation = [
    param('department')
        .notEmpty()
        .withMessage('Department parameter is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters')
];

/**
 * Validation rules for username availability check
 */
const usernameAvailabilityValidation = [
    query('username')
        .notEmpty()
        .withMessage('Username query parameter is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(usernamePattern)
        .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores')
];

/**
 * Validation rules for employee ID availability check
 */
const employeeIdAvailabilityValidation = [
    query('employee_id')
        .notEmpty()
        .withMessage('employee_id query parameter is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Employee ID must be between 3 and 20 characters')
        .matches(employeeIdPattern)
        .withMessage('Employee ID can only contain letters, numbers, and hyphens'),
    
    query('campus_id')
        .notEmpty()
        .withMessage('campus_id query parameter is required')
        .isUUID(4)
        .withMessage('Campus ID must be a valid UUID')
];

/**
 * Validation rules for pagination and filtering
 */
const paginationAndFilterValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('search')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Search term cannot exceed 100 characters'),
    
    query('department')
        .optional()
        .isIn([
            // Academic Departments
            'Academics', 'Mathematics', 'Science', 'English', 'Social Studies', 'Languages', 'Physical Education',
            // Administrative Departments
            'Administration', 'Admissions', 'Accounts', 'Human Resources',
            // Support Departments
            'IT Support', 'Library', 'Transport', 'Hostel', 'Security', 'Maintenance'
        ])
        .withMessage('Invalid department for filtering'),
    
    query('designation')
        .optional()
        .isIn([
            // Administrative Roles
            'Principal', 'Vice-Principal', 'Headmaster', 'Administrator',
            // Teaching Roles
            'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Substitute Teacher',
            // Support Staff
            'Librarian', 'Lab Assistant', 'IT Support',
            // Office Staff
            'Accountant', 'Office Clerk', 'Receptionist',
            // Other Staff
            'Security Guard', 'Cleaner', 'Driver', 'Nurse'
        ])
        .withMessage('Invalid designation for filtering'),
    
    query('status')
        .optional()
        .isIn(['Active', 'On Leave', 'Inactive', 'Terminated'])
        .withMessage('Status must be Active, On Leave, Inactive, or Terminated'),
    
    query('employment_type')
        .optional()
        .isIn(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'])
        .withMessage('Employment type must be Full-time, Part-time, Contract, Temporary, or Intern'),
    
    query('campus_id')
        .optional()
        .isUUID(4)
        .withMessage('Campus ID must be a valid UUID')
];

module.exports = {
    createEmployeeValidation,
    updateEmployeeValidation,
    usernameParamValidation,
    employeeIdParamValidation,
    employmentIdParamValidation,
    campusIdParamValidation,
    departmentParamValidation,
    usernameAvailabilityValidation,
    employeeIdAvailabilityValidation,
    paginationAndFilterValidation
};