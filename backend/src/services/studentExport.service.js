const ExcelJS = require('exceljs');
const studentService = require('./student.service');
const logger = require('../utils/logger');

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
    exportStudents
};
