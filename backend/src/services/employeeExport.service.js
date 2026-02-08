const ExcelJS = require('exceljs');
const employeeModel = require('../models/employee.model');
const logger = require('../utils/logger');

/**
 * Generate Excel file with selected employees data
 * @param {Array<string>} usernames - List of usernames to export
 * @param {Object} context - User context (tenant_id, campus_id, etc.)
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportEmployees = async (usernames, context) => {
    logger.info('SERVICE: Starting employee export', {
        count: usernames?.length,
        tenantId: context.tenant_id
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees Export');

    // Define columns matching the import template/add form
    worksheet.columns = [
        { header: 'Username', key: 'username', width: 20 }, // Visible ID column for updates (Locked)
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Middle Name', key: 'middleName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Date of Birth (YYYY-MM-DD)', key: 'dateOfBirth', width: 25 },
        { header: 'Phone Number', key: 'phoneNumber', width: 18 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Role', key: 'role', width: 24 },

        { header: 'Email', key: 'email', width: 28 },
        { header: 'Contact Phone', key: 'contactPhone', width: 18 },
        { header: 'Alt Phone', key: 'altPhone', width: 18 },
        { header: 'Emergency Contact Name', key: 'emergencyName', width: 24 },
        { header: 'Emergency Contact Phone', key: 'emergencyPhone', width: 20 },
        { header: 'Emergency Contact Relation', key: 'emergencyRelation', width: 24 },
        { header: 'Current Address', key: 'currentAddress', width: 32 },
        { header: 'City', key: 'city', width: 18 },
        { header: 'State', key: 'state', width: 18 },
        { header: 'Pincode', key: 'pincode', width: 12 },
        { header: 'Country', key: 'country', width: 18 },
        { header: 'Permanent Address', key: 'permanentAddress', width: 32 },

        { header: 'Employee ID', key: 'employeeId', width: 18 },
        { header: 'Designation', key: 'designation', width: 22 },
        { header: 'Department', key: 'department', width: 22 },
        { header: 'Joining Date (YYYY-MM-DD)', key: 'joiningDate', width: 25 },
        { header: 'Salary', key: 'salary', width: 14 },
        { header: 'Employment Type', key: 'employmentType', width: 20 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Transport Details', key: 'transportDetails', width: 24 },
        { header: 'Hostel Details', key: 'hostelDetails', width: 24 },

        { header: 'Marital Status', key: 'maritalStatus', width: 18 },
        { header: 'Nationality', key: 'nationality', width: 18 },
        { header: 'Religion', key: 'religion', width: 18 },
        { header: 'Caste', key: 'caste', width: 18 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Blood Group', key: 'bloodGroup', width: 12 },
        { header: 'Height (cm)', key: 'heightCm', width: 14 },
        { header: 'Weight (kg)', key: 'weightKg', width: 14 },
        { header: 'Medical Conditions', key: 'medicalConditions', width: 24 },
        { header: 'Allergies', key: 'allergies', width: 24 },
        { header: 'Occupation', key: 'occupation', width: 18 },
        { header: 'Income', key: 'income', width: 16 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Fetch and add data
    for (const username of usernames) {
        try {
            const emp = await employeeModel.getCompleteEmployeeData(username, context.tenant_id);
            
            if (emp) {
                // Check permissions (e.g. if admin or same campus) - assuming caller handles high-level auth
                // But we should double check if the employee belongs to the campus if the user is not admin
                if (context.role !== 'Admin' && emp.campus_id !== context.campus_id) {
                    logger.warn(`Skipping export for employee ${username} due to campus mismatch`);
                    continue;
                }

                worksheet.addRow({
                    username: emp.username,
                    firstName: emp.first_name,
                    middleName: emp.middle_name,
                    lastName: emp.last_name,
                    dateOfBirth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split('T')[0] : '',
                    phoneNumber: emp.phone_number,
                    gender: emp.gender,
                    role: emp.role,
                    
                    email: emp.email,
                    contactPhone: emp.contact_phone,
                    altPhone: emp.alt_phone,
                    emergencyName: emp.emergency_contact_name,
                    emergencyPhone: emp.emergency_contact_phone,
                    emergencyRelation: emp.emergency_contact_relation,
                    currentAddress: emp.current_address,
                    city: emp.city,
                    state: emp.state,
                    pincode: emp.pincode,
                    country: emp.country,
                    permanentAddress: emp.permanent_address,

                    employeeId: emp.employee_id,
                    designation: emp.designation,
                    department: emp.department,
                    joiningDate: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : '',
                    salary: emp.salary,
                    employmentType: emp.employment_type,
                    status: emp.employment_status,
                    transportDetails: emp.transport_details,
                    hostelDetails: emp.hostel_details,

                    maritalStatus: emp.marital_status, // Assuming this field exists in model response
                    nationality: emp.nationality,
                    religion: emp.religion,
                    caste: emp.caste,
                    category: emp.category,
                    bloodGroup: emp.blood_group,
                    heightCm: emp.height_cm,
                    weightKg: emp.weight_kg,
                    medicalConditions: emp.medical_conditions,
                    allergies: emp.allergies,
                    occupation: emp.occupation,
                    income: emp.income
                });
            }
        } catch (err) {
            logger.error(`Error fetching data for employee ${username} during export`, { error: err.message });
            // Continue with other employees
        }
    }

    // Configure protection
    // 1. Unlock all cells by default (including empty ones)
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.protection = { locked: false };
        });
    });

    // 2. Lock specific columns (Username, Employee ID)
    const lockedKeys = ['username', 'employeeId'];
    const lockedIndices = [];
    
    worksheet.columns.forEach((col, index) => {
        if (lockedKeys.includes(col.key)) {
            lockedIndices.push(index + 1); // 1-based index
        }
    });

    // Apply locking to those columns for all rows
    worksheet.eachRow((row) => {
        lockedIndices.forEach(idx => {
            const cell = row.getCell(idx);
            cell.protection = { locked: true };
        });
    });

    // 3. Protect the sheet
    await worksheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: true,
        autoFilter: true,
        pivotTables: false
    });

    return await workbook.xlsx.writeBuffer();
};

module.exports = {
    exportEmployees
};
