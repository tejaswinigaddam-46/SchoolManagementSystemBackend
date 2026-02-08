const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const employeeModel = require('../models/employee.model');
const logger = require('../utils/logger');

/**
 * Generates an Excel template for employee bulk import
 * @returns {Promise<Buffer>} The Excel file buffer
 */
const generateTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees Import Template');

    worksheet.columns = [
        { header: 'First Name*', key: 'firstName', width: 20 },
        { header: 'Middle Name', key: 'middleName', width: 20 },
        { header: 'Last Name*', key: 'lastName', width: 20 },
        { header: 'Date of Birth* (YYYY-MM-DD)', key: 'dateOfBirth', width: 25 },
        { header: 'Phone Number*', key: 'phoneNumber', width: 18 },
        { header: 'Gender*', key: 'gender', width: 12 },
        { header: 'Role* (Employee/Manager/Admin)', key: 'role', width: 24 },

        { header: 'Email*', key: 'email', width: 28 },
        { header: 'Contact Phone*', key: 'contactPhone', width: 18 },
        { header: 'Alt Phone', key: 'altPhone', width: 18 },
        { header: 'Emergency Contact Name', key: 'emergencyName', width: 24 },
        { header: 'Emergency Contact Phone', key: 'emergencyPhone', width: 20 },
        { header: 'Emergency Contact Relation', key: 'emergencyRelation', width: 24 },
        { header: 'Current Address*', key: 'currentAddress', width: 32 },
        { header: 'City*', key: 'city', width: 18 },
        { header: 'State*', key: 'state', width: 18 },
        { header: 'Pincode', key: 'pincode', width: 12 },
        { header: 'Country', key: 'country', width: 18 },
        { header: 'Permanent Address', key: 'permanentAddress', width: 32 },

        { header: 'Employee ID*', key: 'employeeId', width: 18 },
        { header: 'Designation*', key: 'designation', width: 22 },
        { header: 'Department*', key: 'department', width: 22 },
        { header: 'Joining Date* (YYYY-MM-DD)', key: 'joiningDate', width: 25 },
        { header: 'Salary*', key: 'salary', width: 14 },
        { header: 'Employment Type*', key: 'employmentType', width: 20 },
        { header: 'Status*', key: 'status', width: 16 },
        { header: 'Transport Details', key: 'transportDetails', width: 24 },
        { header: 'Hostel Details', key: 'hostelDetails', width: 24 },

        { header: 'Marital Status', key: 'maritalStatus', width: 18 },
        { header: 'Nationality*', key: 'nationality', width: 18 },
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

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    worksheet.getColumn('gender').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Male,Female,Other"']
    };
    worksheet.getColumn('role').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Employee,Manager,Admin"']
    };
    worksheet.getColumn('employmentType').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Full-time,Part-time,Contract,Intern"']
    };
    worksheet.getColumn('status').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Active,Inactive,On Leave,Terminated"']
    };
    worksheet.getColumn('bloodGroup').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"A+,A-,B+,B-,AB+,AB-,O+,O-"']
    };
    worksheet.getColumn('emergencyRelation').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Spouse,Parent,Sibling,Guardian,Other"']
    };

    worksheet.addRow({
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
        dateOfBirth: '1985-06-15',
        phoneNumber: '+1234567890',
        gender: 'Male',
        role: 'Employee',
        email: 'john.smith@school.edu',
        contactPhone: '+1234567890',
        altPhone: '+0987654321',
        emergencyName: 'Jane Smith',
        emergencyPhone: '+1234567891',
        emergencyRelation: 'Spouse',
        currentAddress: '123 Main Street',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        country: 'USA',
        permanentAddress: '456 Elm Street',
        employeeId: 'EMP001',
        designation: 'Senior Teacher',
        department: 'Mathematics',
        joiningDate: '2023-08-15',
        salary: '55000',
        employmentType: 'Full-time',
        status: 'Active',
        transportDetails: 'Staff Bus Route 5',
        hostelDetails: 'Staff Quarters, Room 10B',
        maritalStatus: 'Single',
        nationality: 'American',
        religion: 'Christian',
        caste: 'General',
        category: 'General',
        bloodGroup: 'O+',
        heightCm: '175',
        weightKg: '70.5',
        medicalConditions: 'None',
        allergies: 'None',
        occupation: 'Teacher',
        income: '55000'
    });

    return await workbook.xlsx.writeBuffer();
};

/**
 * Process uploaded Excel file and import employees
 * @param {string} filePath - Path to uploaded file
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Object containing summary and result file buffer
 */
const importEmployees = async (filePath, tenantId, campusId) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('Invalid Excel file: No worksheet found');

    const results = { total: 0, success: 0, failed: 0, errors: [] };

    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
    });

    const getValue = (row, keyPart) => {
        for (const [colIdx, header] of Object.entries(headers)) {
            if (header && header.toString().toLowerCase().includes(keyPart.toLowerCase())) {
                const val = row.getCell(parseInt(colIdx)).value;
                return (val && typeof val === 'object' && val.text) ? val.text : (val ? val.toString() : null);
            }
        }
        return null;
    };

    const itemsToProcess = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const data = {
            user: {
                first_name: getValue(row, 'First Name'),
                middle_name: getValue(row, 'Middle Name'),
                last_name: getValue(row, 'Last Name'),
                date_of_birth: getValue(row, 'Date of Birth'),
                phone_number: getValue(row, 'Phone Number'),
                role: getValue(row, 'Role'),
            },
            contact: {
                email: getValue(row, 'Email'),
                phone: getValue(row, 'Contact Phone'),
                alt_phone: getValue(row, 'Alt Phone'),
                emergency_contact_name: getValue(row, 'Emergency Contact Name'),
                emergency_contact_phone: getValue(row, 'Emergency Contact Phone'),
                emergency_contact_relation: getValue(row, 'Emergency Contact Relation'),
                current_address: getValue(row, 'Current Address'),
                city: getValue(row, 'City'),
                state: getValue(row, 'State'),
                pincode: getValue(row, 'Pincode'),
                country: getValue(row, 'Country'),
                permanent_address: getValue(row, 'Permanent Address')
            },
            employment: {
                employee_id: getValue(row, 'Employee ID'),
                designation: getValue(row, 'Designation'),
                department: getValue(row, 'Department'),
                joining_date: getValue(row, 'Joining Date'),
                salary: getValue(row, 'Salary'),
                employment_type: getValue(row, 'Employment Type'),
                status: getValue(row, 'Status'),
                transport_details: getValue(row, 'Transport Details'),
                hostel_details: getValue(row, 'Hostel Details')
            },
            personal: {
                gender: getValue(row, 'Gender'),
                marital_status: getValue(row, 'Marital Status'),
                nationality: getValue(row, 'Nationality'),
                religion: getValue(row, 'Religion'),
                caste: getValue(row, 'Caste'),
                category: getValue(row, 'Category'),
                blood_group: getValue(row, 'Blood Group'),
                height_cm: getValue(row, 'Height'),
                weight_kg: getValue(row, 'Weight'),
                medical_conditions: getValue(row, 'Medical Conditions'),
                allergies: getValue(row, 'Allergies'),
                occupation: getValue(row, 'Occupation'),
                income: getValue(row, 'Income')
            },
            originalRow: row,
            rowNumber
        };

        itemsToProcess.push(data);
    });

    results.total = itemsToProcess.length;

    const resultWorkbook = new ExcelJS.Workbook();
    const resultWorksheet = resultWorkbook.addWorksheet('Import Results');
    const resultHeaders = [];
    headerRow.eachCell((cell, colNumber) => {
        resultHeaders.push({ header: cell.value ? cell.value.toString() : '', key: `col_${colNumber}`, width: 18 });
    });
    resultHeaders.push({ header: 'Import Status', key: 'status', width: 16 });
    resultHeaders.push({ header: 'Error Message', key: 'error', width: 40 });
    resultWorksheet.columns = resultHeaders;
    resultWorksheet.getRow(1).font = { bold: true };

    const BATCH_SIZE = 10;

    const processItem = async (item) => {
        const rowData = {};
        item.originalRow.eachCell((cell, colNumber) => {
            const val = cell.value;
            rowData[`col_${colNumber}`] = (val && typeof val === 'object' && val.text) ? val.text : val;
        });

        const missing = [];
        if (!item.user.first_name) missing.push('First Name');
        if (!item.user.last_name) missing.push('Last Name');
        if (!item.user.date_of_birth) missing.push('Date of Birth');
        if (!item.user.phone_number) missing.push('Phone Number');
        if (!item.personal.gender) missing.push('Gender');
        if (!item.user.role) missing.push('Role');
        if (!item.contact.email) missing.push('Email');
        if (!item.contact.phone) missing.push('Contact Phone');
        if (!item.contact.current_address) missing.push('Current Address');
        if (!item.contact.city) missing.push('City');
        if (!item.contact.state) missing.push('State');
        if (!item.employment.employee_id) missing.push('Employee ID');
        if (!item.employment.designation) missing.push('Designation');
        if (!item.employment.department) missing.push('Department');
        if (!item.employment.joining_date) missing.push('Joining Date');
        if (!item.employment.salary) missing.push('Salary');
        if (!item.employment.employment_type) missing.push('Employment Type');
        if (!item.employment.status) missing.push('Status');

        if (missing.length > 0) {
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = `Missing required fields: ${missing.join(', ')}`;
            resultWorksheet.addRow(rowData);
            return;
        }

        try {
            const dob = new Date(item.user.date_of_birth);
            if (isNaN(dob.getTime())) throw new Error('Invalid Date of Birth');
            item.user.date_of_birth = dob.toISOString().split('T')[0];

            const joining = new Date(item.employment.joining_date);
            if (isNaN(joining.getTime())) throw new Error('Invalid Joining Date');
            item.employment.joining_date = joining.toISOString().split('T')[0];

            if (item.employment.salary) {
                const sal = parseFloat(item.employment.salary);
                if (isNaN(sal) || sal < 0) throw new Error('Invalid Salary');
                item.employment.salary = sal;
            }
            if (item.personal.height_cm) {
                const h = parseInt(item.personal.height_cm);
                if (isNaN(h) || h <= 0) throw new Error('Invalid Height (cm)');
                item.personal.height_cm = h;
            }
            if (item.personal.weight_kg) {
                const w = parseFloat(item.personal.weight_kg);
                if (isNaN(w) || w <= 0) throw new Error('Invalid Weight (kg)');
                item.personal.weight_kg = w;
            }
            if (item.personal.income) {
                const inc = parseFloat(item.personal.income);
                if (isNaN(inc) || inc < 0) throw new Error('Invalid Income');
                item.personal.income = inc;
            }
        } catch (e) {
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = e.message;
            resultWorksheet.addRow(rowData);
            return;
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await employeeModel.createEmployeeWithClient(client, item, tenantId, campusId);
            await client.query('COMMIT');
            results.success++;
            rowData.status = 'Success';
            rowData.error = '';
        } catch (error) {
            await client.query('ROLLBACK');
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = error.message;
            logger.error('Employee Bulk Import Error', { error: error.message, row: item.rowNumber });
        } finally {
            client.release();
        }

        resultWorksheet.addRow(rowData);
    };

    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
        const batch = itemsToProcess.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(processItem));
    }

    const resultBuffer = await resultWorkbook.xlsx.writeBuffer();
    return { summary: results, resultFile: resultBuffer };
};

module.exports = {
    generateTemplate,
    importEmployees
};

