const ExcelJS = require('exceljs');
const studentModel = require('../models/student.model');
const logger = require('../utils/logger');

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

module.exports = {
    updateStudents
};
