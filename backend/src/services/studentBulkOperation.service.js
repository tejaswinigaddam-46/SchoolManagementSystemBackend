const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const studentModel = require('../models/student.model');
const logger = require('../utils/logger');
const fs = require('fs');
const studentService = require('./student.service');


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
                
                // Set canonical class_id from DB to satisfy FK
                item.data.class_id = classRes.rows[0].class_id;
                // Keep class name for any other logging or legacy uses if needed, but class_id takes precedence in model
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
/**
 * Process uploaded Excel file and update students
 * @param {string} filePath - Path to uploaded file
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Object containing summary and result file buffer
 */
const updateStudents = async (filePath, tenantId, campusId) => {
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
            if (header && header.toString().toLowerCase() === keyPart.toLowerCase()) {
                const cell = row.getCell(parseInt(colIdx));
                // Handle Rich Text or simple value
                const val = cell.value;
                if (val && typeof val === 'object' && val.text) return val.text;
                return val ? val.toString() : null;
            }
            // Also try fuzzy match if exact match fails, but be careful
             if (header && header.toString().toLowerCase().includes(keyPart.toLowerCase())) {
                 const cell = row.getCell(parseInt(colIdx));
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

        // Try to get username (hidden column) first
        let username = getValue(row, 'Username');
        // If not found, try by Admission Number (locked column)
        const admissionNumber = getValue(row, 'Admission Number');
        
        // We need at least one identifier
        if (!username && !admissionNumber) {
            results.errors.push(`Row ${rowNumber}: Missing Username and Admission Number. Cannot identify student.`);
            results.failed++;
            return;
        }

        const updateData = {
            username: username, // Might be null, will resolve later
            admissionNumber: admissionNumber,
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
        // Note: Export used 'Father First Name' etc, Import uses 'Parent 1 First Name'.
        // We should support what Export produced.
        // Export: Father First Name, Father Last Name, etc.
        // But the user might edit it. 
        // Let's look for "Father" and "Mother" headers first, then fallback to "Parent 1" etc.
        
        const getParentValue = (pType, field) => {
            // Try specific headers like "Father First Name"
            let val = getValue(row, `${pType} ${field}`);
            if (val) return val;
            
            // Try generic "Parent 1" headers if pType is Father (P1) or Mother (P2)
            if (pType === 'Father') val = getValue(row, `Parent 1 ${field}`);
            if (pType === 'Mother') val = getValue(row, `Parent 2 ${field}`);
            return val;
        };

        const p1 = {
            firstName: getParentValue('Father', 'First Name'),
            lastName: getParentValue('Father', 'Last Name'),
            email: getParentValue('Father', 'Email'),
            phone: getParentValue('Father', 'Phone'),
            relation: 'Father', // Fixed for P1 if using Father headers
            // occupation: getParentValue('Father', 'Occupation'), // Add if needed
        };
        // If we found data using generic "Parent 1" headers, the relation might be different
        if (!p1.firstName && getValue(row, 'Parent 1 First Name')) {
             p1.firstName = getValue(row, 'Parent 1 First Name');
             p1.lastName = getValue(row, 'Parent 1 Last Name');
             p1.email = getValue(row, 'Parent 1 Email');
             p1.phone = getValue(row, 'Parent 1 Phone');
             p1.relation = getValue(row, 'Parent 1 Relation');
        }

        if (p1.firstName) updateData.parents.push(p1);

        const p2 = {
            firstName: getParentValue('Mother', 'First Name'),
            lastName: getParentValue('Mother', 'Last Name'),
            email: getParentValue('Mother', 'Email'),
            phone: getParentValue('Mother', 'Phone'),
            relation: 'Mother',
        };
         if (!p2.firstName && getValue(row, 'Parent 2 First Name')) {
             p2.firstName = getValue(row, 'Parent 2 First Name');
             p2.lastName = getValue(row, 'Parent 2 Last Name');
             p2.email = getValue(row, 'Parent 2 Email');
             p2.phone = getValue(row, 'Parent 2 Phone');
             p2.relation = getValue(row, 'Parent 2 Relation');
        }

        if (p2.firstName) updateData.parents.push(p2);

        studentsToProcess.push({ rowNumber, data: updateData });
    });

    results.total = studentsToProcess.length;

    // Process updates
    for (const item of studentsToProcess) {
        try {
            let { username, admissionNumber } = item.data;
            
            // If username is missing, resolve by admission number
            if (!username && admissionNumber) {
                const student = await studentModel.findStudentByAdmissionNumber(admissionNumber, tenantId);
                if (student) {
                    username = student.username;
                } else {
                    throw new Error(`Student with Admission Number ${admissionNumber} not found.`);
                }
            }

            if (!username) {
                 throw new Error(`Cannot identify student. Missing Username and Admission Number not found.`);
            }

            // Perform Update
            await studentModel.updateStudent(username, item.data, tenantId);
            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push(`Row ${item.rowNumber}: ${error.message}`);
            logger.error(`Error updating student at row ${item.rowNumber}`, { error: error.message });
        }
    }

    // Output Workbook for results (Errors only or full status)
    const resultWorkbook = new ExcelJS.Workbook();
    const resultWorksheet = resultWorkbook.addWorksheet('Update Results');
    
    resultWorksheet.columns = [
        { header: 'Row Number', key: 'row', width: 10 },
        { header: 'Student', key: 'student', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Error Message', key: 'error', width: 50 }
    ];

    // Populate results
    // We only have errors in results.errors array which are strings. 
    // Ideally we should track status per row.
    // For now, let's just list the errors if any.
    
    if (results.errors.length > 0) {
        results.errors.forEach(err => {
             resultWorksheet.addRow({
                 row: 'N/A', // We didn't structurize errors well enough, but string has "Row X: ..."
                 student: 'N/A',
                 status: 'Failed',
                 error: err
             });
        });
    } else {
         resultWorksheet.addRow({
             row: '-',
             student: 'All processed',
             status: 'Success',
             error: '-'
         });
    }

    return {
        summary: {
            total: results.total,
            success: results.success,
            failed: results.failed
        },
        fileBuffer: await resultWorkbook.xlsx.writeBuffer()
    };
};
const exportStudents = async (usernames, context) => {
    logger.info('SERVICE: Starting student export', {
        count: usernames?.length,
        tenantId: context.tenant_id
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students Export');

    // Define columns matching the Add Student Form and Bulk Import Template
    worksheet.columns = [
        { header: 'Username', key: 'username', width: 20 }, // Visible ID column for updates (Locked)
        { header: 'Admission Number', key: 'admissionNumber', width: 20 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Middle Name', key: 'middleName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Blood Group', key: 'bloodGroup', width: 12 },
        { header: 'Nationality', key: 'nationality', width: 15 },
        { header: 'Religion', key: 'religion', width: 15 },
        { header: 'Caste', key: 'caste', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Section', key: 'section', width: 15 },
        { header: 'Academic Year', key: 'academicYear', width: 20 },
        { header: 'Curriculum', key: 'curriculum', width: 15 },
        { header: 'Medium', key: 'medium', width: 15 },
        
        { header: 'Admission Date', key: 'admissionDate', width: 15 },
        { header: 'Admission Type', key: 'admissionType', width: 15 },
        { header: 'Registration Number', key: 'registrationNumber', width: 20 },
        { header: 'TC Number', key: 'transferCertificateNumber', width: 20 },
        { header: 'Previous School', key: 'previousSchool', width: 25 },
        
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone Number', key: 'phoneNumber', width: 15 },
        { header: 'Alternate Phone', key: 'alternatePhoneNumber', width: 15 },
        
        { header: 'Current Address', key: 'currentAddress', width: 30 },
        { header: 'Permanent Address', key: 'permanentAddress', width: 30 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Pincode', key: 'pincode', width: 12 },
        { header: 'Country', key: 'country', width: 15 },
        
        { header: 'Medical Conditions', key: 'medicalConditions', width: 25 },
        { header: 'Allergies', key: 'allergies', width: 25 },
        { header: 'Height (cm)', key: 'height', width: 12 },
        { header: 'Weight (kg)', key: 'weight', width: 12 },
        
        { header: 'Transport Mode', key: 'transportMode', width: 15 },
        { header: 'Hostel Required', key: 'hostelRequired', width: 15 },
        { header: 'Scholarship Applied', key: 'scholarshipApplied', width: 15 },
        
        // Parent 1
        { header: 'Father First Name', key: 'fatherFirstName', width: 15 },
        { header: 'Father Last Name', key: 'fatherLastName', width: 15 },
        { header: 'Father Relation', key: 'fatherRelation', width: 15 },
        { header: 'Father Phone', key: 'fatherPhone', width: 15 },
        { header: 'Father Email', key: 'fatherEmail', width: 25 },
        { header: 'Father Occupation', key: 'fatherOccupation', width: 20 },
        { header: 'Father Income', key: 'fatherIncome', width: 15 },
        
        // Parent 2
        { header: 'Mother First Name', key: 'motherFirstName', width: 15 },
        { header: 'Mother Last Name', key: 'motherLastName', width: 15 },
        { header: 'Mother Relation', key: 'motherRelation', width: 15 },
        { header: 'Mother Phone', key: 'motherPhone', width: 15 },
        { header: 'Mother Email', key: 'motherEmail', width: 25 },
        { header: 'Mother Occupation', key: 'motherOccupation', width: 20 },
        { header: 'Mother Income', key: 'motherIncome', width: 15 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Fetch and add data
    for (const username of usernames) {
        try {
            const student = await studentService.getCompleteStudentForEdit(username, context.tenant_id);
            
            if (student) {
                // Check permissions if needed (Admin only or scoped)
                // Assuming caller handles high-level auth
                
                // Map Parents
                let father = {};
                let mother = {};
                
                if (student.parents && Array.isArray(student.parents)) {
                    father = student.parents.find(p => p.relation === 'Father') || {};
                    mother = student.parents.find(p => p.relation === 'Mother') || {};
                    
                    // If no explicit father/mother, take first/second
                    if (!father.firstName && student.parents.length > 0) father = student.parents[0];
                    if (!mother.firstName && student.parents.length > 1) mother = student.parents[1];
                }

                worksheet.addRow({
                    username: student.username,
                    admissionNumber: student.admissionNumber,
                    firstName: student.firstName,
                    middleName: student.middleName,
                    lastName: student.lastName,
                    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                    gender: student.gender,
                    bloodGroup: student.bloodGroup,
                    nationality: student.nationality,
                    religion: student.religion,
                    caste: student.caste,
                    category: student.category,
                    
                    class: student.enrollment?.class,
                    section: student.enrollment?.sectionName || student.section || '',
                    academicYear: student.enrollment?.year_name,
                    curriculum: student.enrollment?.curriculum_name,
                    medium: student.enrollment?.medium,
                    
                    admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] : '',
                    admissionType: student.admissionType,
                    registrationNumber: student.registrationNumber,
                    transferCertificateNumber: student.transferCertificateNumber,
                    previousSchool: student.previousSchool,
                    
                    email: student.email,
                    phoneNumber: student.phoneNumber,
                    alternatePhoneNumber: student.alternatePhoneNumber,
                    
                    currentAddress: student.currentAddress,
                    permanentAddress: student.permanentAddress,
                    city: student.city,
                    state: student.state,
                    pincode: student.pincode,
                    country: student.country,
                    
                    medicalConditions: student.medicalConditions,
                    allergies: student.allergies,
                    height: student.height,
                    weight: student.weight,
                    
                    transportMode: student.transportMode,
                    hostelRequired: student.hostelRequired,
                    scholarshipApplied: student.scholarshipApplied,
                    
                    fatherName: father.firstName ? `${father.firstName} ${father.lastName || ''}` : '',
                    fatherRelation: father.relation,
                    fatherPhone: father.phone,
                    fatherEmail: father.email,
                    fatherOccupation: father.occupation,
                    fatherIncome: father.income,
                    
                    motherName: mother.firstName ? `${mother.firstName} ${mother.lastName || ''}` : '',
                    motherRelation: mother.relation,
                    motherPhone: mother.phone,
                    motherEmail: mother.email,
                    motherOccupation: mother.occupation,
                    motherIncome: mother.income
                });
            }
        } catch (err) {
            logger.error(`Error fetching data for student ${username} during export`, { error: err.message });
        }
    }

    // Configure protection
    // 1. Unlock all cells by default (including empty ones)
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.protection = { locked: false };
        });
    });

    // 2. Lock specific columns (Username, Admission Number)
    // Identify column indices
    const lockedKeys = ['username', 'admissionNumber'];
    const lockedIndices = [];
    
    worksheet.columns.forEach((col, index) => {
        if (lockedKeys.includes(col.key)) {
            lockedIndices.push(index + 1); // 1-based index
        }
    });

    // Apply locking to those columns for all rows (including header)
    worksheet.eachRow((row) => {
        lockedIndices.forEach(idx => {
            const cell = row.getCell(idx);
            cell.protection = { locked: true };
        });
    });

    // 3. Protect the sheet with a password (optional, using empty string for no password but enabled protection)
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
    generateTemplate,
    importStudents,
    updateStudents,
    exportStudents
};
