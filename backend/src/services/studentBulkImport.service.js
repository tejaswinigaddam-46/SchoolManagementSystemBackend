const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const studentModel = require('../models/student.model');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * Generates an Excel template for student bulk import
 * @returns {Promise<Buffer>} The Excel file buffer
 */
const generateTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students Import Template');

    // Define columns
    worksheet.columns = [
        { header: 'Admission Number*', key: 'admissionNumber', width: 20 },
        { header: 'First Name*', key: 'firstName', width: 20 },
        { header: 'Last Name*', key: 'lastName', width: 20 },
        { header: 'Date of Birth* (YYYY-MM-DD)', key: 'dateOfBirth', width: 25 },
        { header: 'Email*', key: 'email', width: 25 },
        { header: 'Phone Number', key: 'phoneNumber', width: 15 },
        { header: 'Gender*', key: 'gender', width: 10 },
        { header: 'Class*', key: 'class', width: 10 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Academic Year* (e.g. 2024-2025)', key: 'academicYear', width: 25 },
        { header: 'Medium*', key: 'medium', width: 15 },
        { header: 'Curriculum*', key: 'curriculum', width: 15 },
        { header: 'Middle Name', key: 'middleName', width: 15 },
        { header: 'Admission Date* (YYYY-MM-DD)', key: 'admissionDate', width: 25 },
        { header: 'Registration Number', key: 'registrationNumber', width: 20 },
        { header: 'Admission Type', key: 'admissionType', width: 15 },
        { header: 'TC Number', key: 'transferCertificateNumber', width: 15 },
        { header: 'Scholarship (Yes/No)', key: 'scholarshipApplied', width: 15 },
        { header: 'Previous School', key: 'previousSchool', width: 20 },
        { header: 'Transport Mode', key: 'transportMode', width: 15 },
        { header: 'Hostel Required (Yes/No)', key: 'hostelRequired', width: 15 },
        { header: 'Alternate Phone', key: 'alternatePhoneNumber', width: 15 },
        { header: 'Nationality*', key: 'nationality', width: 15 },
        { header: 'Religion', key: 'religion', width: 15 },
        { header: 'Caste', key: 'caste', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Blood Group', key: 'bloodGroup', width: 10 },
        { header: 'Height (cm)', key: 'height', width: 10 },
        { header: 'Weight (kg)', key: 'weight', width: 10 },
        { header: 'Medical Conditions', key: 'medicalConditions', width: 20 },
        { header: 'Allergies', key: 'allergies', width: 20 },
        { header: 'Current Address*', key: 'currentAddress', width: 30 },
        { header: 'City*', key: 'city', width: 15 },
        { header: 'State*', key: 'state', width: 15 },
        { header: 'Pincode', key: 'pincode', width: 10 },
        { header: 'Country', key: 'country', width: 15 },
        { header: 'Permanent Address', key: 'permanentAddress', width: 30 },
        
        // Parent 1 Details (Mandatory)
        { header: 'Parent 1 First Name*', key: 'p1FirstName', width: 20 },
        { header: 'Parent 1 Last Name*', key: 'p1LastName', width: 20 },
        { header: 'Parent 1 Email*', key: 'p1Email', width: 25 },
        { header: 'Parent 1 Phone*', key: 'p1Phone', width: 15 },
        { header: 'Parent 1 Relation*', key: 'p1Relation', width: 15 },
        { header: 'Parent 1 DOB* (YYYY-MM-DD)', key: 'p1Dob', width: 25 },
        { header: 'Parent 1 Occupation', key: 'p1Occupation', width: 20 },
        { header: 'Parent 1 Income', key: 'p1Income', width: 15 },
        { header: 'Parent 1 Emergency Contact (Yes/No)*', key: 'p1Emergency', width: 25 },

        // Parent 2 Details (Optional)
        { header: 'Parent 2 First Name', key: 'p2FirstName', width: 20 },
        { header: 'Parent 2 Last Name', key: 'p2LastName', width: 20 },
        { header: 'Parent 2 Email', key: 'p2Email', width: 25 },
        { header: 'Parent 2 Phone', key: 'p2Phone', width: 15 },
        { header: 'Parent 2 Relation', key: 'p2Relation', width: 15 },
        { header: 'Parent 2 DOB (YYYY-MM-DD)', key: 'p2Dob', width: 25 },
        { header: 'Parent 2 Occupation', key: 'p2Occupation', width: 20 },
        { header: 'Parent 2 Income', key: 'p2Income', width: 15 },
        { header: 'Parent 2 Emergency Contact (Yes/No)', key: 'p2Emergency', width: 25 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data validation
    // Gender
    worksheet.getColumn('gender').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Male,Female,Other"']
    };

    // Yes/No fields
    const yesNoValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Yes,No"']
    };
    worksheet.getColumn('scholarshipApplied').dataValidation = yesNoValidation;
    worksheet.getColumn('hostelRequired').dataValidation = yesNoValidation;
    worksheet.getColumn('p1Emergency').dataValidation = yesNoValidation;
    worksheet.getColumn('p2Emergency').dataValidation = yesNoValidation;

    // Blood Group
    worksheet.getColumn('bloodGroup').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"A+,A-,B+,B-,AB+,AB-,O+,O-"']
    };

    // Relations
    const relationValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Father,Mother,Guardian,Other"']
    };
    worksheet.getColumn('p1Relation').dataValidation = relationValidation;
    worksheet.getColumn('p2Relation').dataValidation = relationValidation;

    // Add an example row
    worksheet.addRow({
        admissionNumber: 'ADM001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2010-01-01',
        email: 'john.doe@example.com',
        phoneNumber: '9876543210',
        gender: 'Male',
        class: '10',
        section: 'A',
        academicYear: '2024-2025',
        admissionDate: '2024-04-01',
        admissionType: 'Regular',
        scholarshipApplied: 'No',
        hostelRequired: 'No',
        nationality: 'Indian',
        currentAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        p1FirstName: 'Jane',
        p1LastName: 'Doe',
        p1Email: 'jane.doe@example.com',
        p1Phone: '9876543211',
        p1Relation: 'Mother',
        p1Dob: '1980-01-01',
        p1Emergency: 'Yes',
        p1Occupation: 'Engineer',
        p1Income: '50000'
    });

    return await workbook.xlsx.writeBuffer();
};

/**
 * Process uploaded Excel file and import students
 * @param {string} filePath - Path to uploaded file
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Object containing summary and result file buffer
 */
const importStudents = async (filePath, tenantId, campusId) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        throw new Error('Invalid Excel file: No worksheet found');
    }

    const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: []
    };

    // Get headers map
    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
    });

    const getValue = (row, keyPart) => {
        for (const [colIdx, header] of Object.entries(headers)) {
            if (header && header.toString().toLowerCase().includes(keyPart.toLowerCase())) {
                const cell = row.getCell(parseInt(colIdx));
                // Handle Rich Text or simple value
                const val = cell.value;
                if (val && typeof val === 'object' && val.text) return val.text;
                return val ? val.toString() : null;
            }
        }
        return null;
    };

    const studentsToProcess = [];

    // First pass: Read all data
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const studentData = {
            admissionNumber: getValue(row, 'Admission Number'),
            firstName: getValue(row, 'First Name'),
            lastName: getValue(row, 'Last Name'),
            dateOfBirth: getValue(row, 'Date of Birth'),
            email: getValue(row, 'Email'),
            phoneNumber: getValue(row, 'Phone Number'),
            gender: getValue(row, 'Gender'),
            class: getValue(row, 'Class'),
            section: getValue(row, 'Section'),
            academicYear: getValue(row, 'Academic Year'),
            medium: getValue(row, 'Medium'),
            curriculum: getValue(row, 'Curriculum'),
            middleName: getValue(row, 'Middle Name'),
            admissionDate: getValue(row, 'Admission Date'),
            registrationNumber: getValue(row, 'Registration Number'),
            admissionType: getValue(row, 'Admission Type'),
            transferCertificateNumber: getValue(row, 'TC Number'),
            scholarshipApplied: getValue(row, 'Scholarship'),
            previousSchool: getValue(row, 'Previous School'),
            transportMode: getValue(row, 'Transport Mode'),
            hostelRequired: getValue(row, 'Hostel Required'),
            alternatePhoneNumber: getValue(row, 'Alternate Phone'),
            nationality: getValue(row, 'Nationality'),
            religion: getValue(row, 'Religion'),
            caste: getValue(row, 'Caste'),
            category: getValue(row, 'Category'),
            bloodGroup: getValue(row, 'Blood Group'),
            height: getValue(row, 'Height'),
            weight: getValue(row, 'Weight'),
            medicalConditions: getValue(row, 'Medical Conditions'),
            allergies: getValue(row, 'Allergies'),
            currentAddress: getValue(row, 'Current Address'),
            city: getValue(row, 'City'),
            state: getValue(row, 'State'),
            pincode: getValue(row, 'Pincode'),
            country: getValue(row, 'Country'),
            permanentAddress: getValue(row, 'Permanent Address'),
            
            // Parents
            parents: []
        };

        // Extract Parent 1
        const p1 = {
            firstName: getValue(row, 'Parent 1 First Name'),
            lastName: getValue(row, 'Parent 1 Last Name'),
            email: getValue(row, 'Parent 1 Email'),
            phone: getValue(row, 'Parent 1 Phone'),
            relation: getValue(row, 'Parent 1 Relation'),
            dateOfBirth: getValue(row, 'Parent 1 DOB'),
            occupation: getValue(row, 'Parent 1 Occupation'),
            income: getValue(row, 'Parent 1 Income'),
            isEmergency: getValue(row, 'Parent 1 Emergency')
        };
        if (p1.firstName) studentData.parents.push(p1);

        // Extract Parent 2
        const p2 = {
            firstName: getValue(row, 'Parent 2 First Name'),
            lastName: getValue(row, 'Parent 2 Last Name'),
            email: getValue(row, 'Parent 2 Email'),
            phone: getValue(row, 'Parent 2 Phone'),
            relation: getValue(row, 'Parent 2 Relation'),
            dateOfBirth: getValue(row, 'Parent 2 DOB'),
            occupation: getValue(row, 'Parent 2 Occupation'),
            income: getValue(row, 'Parent 2 Income'),
            isEmergency: getValue(row, 'Parent 2 Emergency')
        };
        if (p2.firstName) studentData.parents.push(p2);

        studentsToProcess.push({ rowNumber, data: studentData, originalRow: row });
    });

    results.total = studentsToProcess.length;

    // Output Workbook for results
    const resultWorkbook = new ExcelJS.Workbook();
    const resultWorksheet = resultWorkbook.addWorksheet('Import Results');
    
    // Copy headers from original
    const resultHeaders = [];
    headerRow.eachCell((cell, colNumber) => {
        resultHeaders.push({ 
            header: cell.value ? cell.value.toString() : '', 
            key: `col_${colNumber}`,
            width: 15
        });
    });
    // Add Status and Error columns
    resultHeaders.push({ header: 'Import Status', key: 'status', width: 15 });
    resultHeaders.push({ header: 'Error Message', key: 'error', width: 40 });
    resultWorksheet.columns = resultHeaders;
    
    // Style header
    resultWorksheet.getRow(1).font = { bold: true };

    const BATCH_SIZE = 10; // Smaller batch size for better error handling with complex parent creation

    const processStudent = async (item) => {
        const rowData = {};
        // Copy original data to result row
        item.originalRow.eachCell((cell, colNumber) => {
            const val = cell.value;
            rowData[`col_${colNumber}`] = (val && typeof val === 'object' && val.text) ? val.text : val;
        });

        // Validation
        const missingFields = [];
        if (!item.data.admissionNumber) missingFields.push('Admission Number');
        if (!item.data.firstName) missingFields.push('First Name');
        if (!item.data.lastName) missingFields.push('Last Name');
        if (!item.data.dateOfBirth) missingFields.push('Date of Birth');
        if (!item.data.email) missingFields.push('Email');
        if (!item.data.academicYear) missingFields.push('Academic Year');
        if (!item.data.medium) missingFields.push('Medium');
        if (!item.data.curriculum) missingFields.push('Curriculum');
        if (!item.data.admissionDate) missingFields.push('Admission Date');
        if (!item.data.nationality) missingFields.push('Nationality');
        if (!item.data.currentAddress) missingFields.push('Current Address');
        if (!item.data.city) missingFields.push('City');
        if (!item.data.state) missingFields.push('State');
        
        // Parent validation
        if (item.data.parents.length === 0) {
            missingFields.push('At least one parent is required');
        } else {
            const p1 = item.data.parents[0];
            if (!p1.firstName) missingFields.push('Parent 1 First Name');
            if (!p1.lastName) missingFields.push('Parent 1 Last Name');
            if (!p1.email) missingFields.push('Parent 1 Email');
            if (!p1.phone) missingFields.push('Parent 1 Phone');
            if (!p1.relation) missingFields.push('Parent 1 Relation');
            if (!p1.dateOfBirth) missingFields.push('Parent 1 DOB');
        }

        if (missingFields.length > 0) {
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = `Missing required fields: ${missingFields.join(', ')}`;
            resultWorksheet.addRow(rowData);
            return;
        }

        // Format dates
        try {
            const dob = new Date(item.data.dateOfBirth);
            if (isNaN(dob.getTime())) throw new Error('Invalid Student DOB');
            item.data.dateOfBirth = dob.toISOString().split('T')[0];

            const admDate = new Date(item.data.admissionDate);
            if (isNaN(admDate.getTime())) throw new Error('Invalid Admission Date');
            item.data.admissionDate = admDate.toISOString().split('T')[0];

            // Parent dates
            item.data.parents.forEach((p, idx) => {
                if (p.dateOfBirth) {
                    const pDob = new Date(p.dateOfBirth);
                    if (isNaN(pDob.getTime())) throw new Error(`Invalid Parent ${idx+1} DOB`);
                    p.dateOfBirth = pDob.toISOString().split('T')[0];
                }
                
                p.isEmergency = p.isEmergency && p.isEmergency.toLowerCase() === 'yes';
            });

            item.data.scholarshipApplied = item.data.scholarshipApplied?.toLowerCase() === 'yes' ? 'Yes' : 'No';
            item.data.hostelRequired = item.data.hostelRequired?.toLowerCase() === 'yes' ? 'Yes' : 'No';

            if (item.data.class) {
                const cls = item.data.class.toString().trim();
                if (item.data.section) {
                    item.data.sectionName = item.data.section.toString().trim().toUpperCase();
                    item.data.class = cls;
                } else {
                    const match = cls.match(/^(\d+)\s*-?\s*([A-Za-z]+)$/);
                    if (match) {
                        item.data.class = match[1];
                        item.data.sectionName = match[2].toUpperCase();
                    } else {
                        item.data.class = cls;
                    }
                }
            }

        } catch (err) {
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = err.message;
            resultWorksheet.addRow(rowData);
            return;
        }

        // Process Database Insertion
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Query for academic year
            const academicYearInput = item.data.academicYear.toString().trim();
            const mediumInput = item.data.medium.toString().trim();
            const curriculumInput = item.data.curriculum.toString().trim();

            const yearRes = await client.query(
                `SELECT ay.academic_year_id 
                 FROM academic_years ay
                 JOIN curricula c ON ay.curriculum_id = c.curriculum_id
                 WHERE ay.campus_id = $1 
                 AND LOWER(ay.year_name) = LOWER($2) 
                 AND LOWER(ay.medium) = LOWER($3)
                 AND (LOWER(c.curriculum_name) = LOWER($4) OR LOWER(c.curriculum_code) = LOWER($4))`,
                [campusId, academicYearInput, mediumInput, curriculumInput]
            );
            
            if (yearRes.rows.length === 0) {
                throw new Error(`Academic Year '${academicYearInput}' with medium '${mediumInput}' and curriculum '${curriculumInput}' not found. Please check if the academic year exists and matches the specified medium and curriculum.`);
            }
            item.data.academicYearId = yearRes.rows[0].academic_year_id;

            // Resolve class name to match existing classes to satisfy FK constraint
            if (item.data.class) {
                const classInputRaw = item.data.class.toString().trim();
                const classLevelNumeric = /^[0-9]+$/.test(classInputRaw) ? parseInt(classInputRaw, 10) : null;
                
                // Try exact class_name (case-insensitive) match first
                let classRes = await client.query(
                    `SELECT class_id, class_name, class_level 
                     FROM classes 
                     WHERE campus_id = $1 AND LOWER(class_name) = LOWER($2)
                     ORDER BY class_id ASC`,
                    [campusId, classInputRaw]
                );
                
                // If not found and input is numeric, try by class_level
                if (classRes.rows.length === 0 && classLevelNumeric !== null) {
                    classRes = await client.query(
                        `SELECT class_id, class_name, class_level 
                         FROM classes 
                         WHERE campus_id = $1 AND class_level = $2
                         ORDER BY class_id ASC`,
                        [campusId, classLevelNumeric]
                    );
                    
                    // If multiple classes share the same level, avoid ambiguity
                    if (classRes.rows.length > 1) {
                        throw new Error(`Multiple classes found for level '${classLevelNumeric}'. Please use an exact class name. Options: ${classRes.rows.map(r => r.class_name).join(', ')}`);
                    }
                }
                
                if (classRes.rows.length === 0) {
                    throw new Error(`Class '${classInputRaw}' not found in campus. Please create the class or use the exact class name as in system.`);
                }
                
                // Set canonical class_name from DB to satisfy FK
                item.data.class = classRes.rows[0].class_name;
            }

            // Call model
            await studentModel.createStudentWithClient(client, item.data, tenantId, campusId);
            
            await client.query('COMMIT');
            results.success++;
            rowData.status = 'Success';
            rowData.error = '';
        } catch (error) {
            await client.query('ROLLBACK');
            results.failed++;
            rowData.status = 'Failed';
            rowData.error = error.message;
            logger.error('Bulk Import Error', { error: error.message, row: item.rowNumber });
        } finally {
            client.release();
        }
        
        resultWorksheet.addRow(rowData);
    };

    // Process in batches
    for (let i = 0; i < studentsToProcess.length; i += BATCH_SIZE) {
        const batch = studentsToProcess.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(item => processStudent(item)));
    }

    const resultBuffer = await resultWorkbook.xlsx.writeBuffer();
    return {
        summary: results,
        resultFile: resultBuffer
    };
};

module.exports = {
    generateTemplate,
    importStudents
};
