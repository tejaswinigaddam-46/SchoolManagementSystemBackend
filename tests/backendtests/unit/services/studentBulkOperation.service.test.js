const studentBulkOperationService = require('@/services/studentBulkOperation.service');
const studentModel = require('@/models/student.model');
const studentService = require('@/services/student.service');
const ExcelJS = require('exceljs');
const { pool } = require('@/config/database');
const fs = require('fs');
const path = require('path');

jest.mock('@/models/student.model');
jest.mock('@/services/student.service');
jest.mock('@/config/database');

describe('Student Bulk Operation Service', () => {
    let mockClient;

    beforeEach(() => {
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        pool.connect.mockResolvedValue(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateTemplate', () => {
        it('should generate an excel template buffer', async () => {
            const buffer = await studentBulkOperationService.generateTemplate();
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });

    describe('exportStudents', () => {
        it('should export students to excel buffer', async () => {
            const usernames = ['stu1'];
            const context = { tenant_id: 'tenant-1' };

            studentService.getCompleteStudentForEdit.mockResolvedValue({
                username: 'stu1',
                admissionNumber: 'ADM001',
                firstName: 'John',
                lastName: 'Doe',
                parents: [
                    { relation: 'Father', firstName: 'Jack' },
                    { relation: 'Mother', firstName: 'Jill' }
                ]
            });

            const buffer = await studentBulkOperationService.exportStudents(usernames, context);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(studentService.getCompleteStudentForEdit).toHaveBeenCalledWith('stu1', 'tenant-1');
        });

        it('should handle errors gracefully during export of a specific student', async () => {
            const usernames = ['stu1'];
            const context = { tenant_id: 'tenant-1' };

            studentService.getCompleteStudentForEdit.mockRejectedValue(new Error('Fetch Error'));

            const buffer = await studentBulkOperationService.exportStudents(usernames, context);
            expect(buffer).toBeInstanceOf(Buffer); // Still generates the excel, just without that student
        });
    });

    describe('updateStudents', () => {
        const testFilePath = path.join(__dirname, 'test_update_students.xlsx');
        
        beforeAll(async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');
            worksheet.addRow(['Username', 'First Name']);
            worksheet.addRow(['stu1', 'Updated Name']);
            await workbook.xlsx.writeFile(testFilePath);
        });

        afterAll(() => {
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        });

        it('should update students from excel file', async () => {
            studentModel.updateStudent.mockResolvedValue(true);

            const result = await studentBulkOperationService.updateStudents(testFilePath, 'tenant-1', 'camp-1');

            expect(result.summary.total).toBe(1);
            expect(result.summary.success).toBe(1);
            expect(result.summary.failed).toBe(0);
            expect(result.fileBuffer).toBeInstanceOf(Buffer);
            expect(studentModel.updateStudent).toHaveBeenCalled();
        });

        it('should track failures during update', async () => {
            studentModel.updateStudent.mockRejectedValue(new Error('Update Failed'));

            const result = await studentBulkOperationService.updateStudents(testFilePath, 'tenant-1', 'camp-1');

            expect(result.summary.total).toBe(1);
            expect(result.summary.success).toBe(0);
            expect(result.summary.failed).toBe(1);
            // The service returns fileBuffer instead of errors directly when there are failures
            expect(result.fileBuffer).toBeDefined();
        });
    });
});
