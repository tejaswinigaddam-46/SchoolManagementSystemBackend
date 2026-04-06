const employeeBulkOperationService = require('@/services/employeeBulkOperation.service');
const employeeModel = require('@/models/employee.model');
const ExcelJS = require('exceljs');
const { pool } = require('@/config/database');
const fs = require('fs');
const path = require('path');

jest.mock('@/models/employee.model');
jest.mock('@/config/database');

describe('Employee Bulk Operation Service', () => {
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

    describe('downloadTemplate', () => {
        it('should generate an excel template buffer', async () => {
            const buffer = await employeeBulkOperationService.downloadTemplate();
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });

    describe('exportEmployees', () => {
        it('should export employees to excel buffer', async () => {
            const usernames = ['emp1'];
            const context = { tenant_id: 'tenant-1' };

            employeeModel.getCompleteEmployeeData.mockResolvedValue({
                username: 'emp1',
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com'
            });

            const buffer = await employeeBulkOperationService.exportEmployees(usernames, context);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(employeeModel.getCompleteEmployeeData).toHaveBeenCalledWith('emp1', 'tenant-1');
        });

        it('should handle errors gracefully during export of a specific employee', async () => {
            const usernames = ['emp1'];
            const context = { tenant_id: 'tenant-1' };

            employeeModel.getCompleteEmployeeData.mockRejectedValue(new Error('Fetch Error'));

            const buffer = await employeeBulkOperationService.exportEmployees(usernames, context);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });

    describe('updateEmployees', () => {
        const testFilePath = path.join(__dirname, 'test_update_employees.xlsx');
        
        beforeAll(async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');
            worksheet.addRow(['Username', 'First Name']);
            worksheet.addRow(['emp1', 'Updated Name']);
            await workbook.xlsx.writeFile(testFilePath);
        });

        afterAll(() => {
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        });

        it('should update employees from excel file', async () => {
            employeeModel.updateEmployee.mockResolvedValue(true);

            const result = await employeeBulkOperationService.updateEmployees(testFilePath, 'tenant-1', 'camp-1');

            expect(result.summary.total).toBe(1);
            expect(result.summary.success).toBe(1);
            expect(result.summary.failed).toBe(0);
            expect(result.fileBuffer).toBeInstanceOf(Buffer);
            expect(employeeModel.updateEmployee).toHaveBeenCalled();
        });

        it('should track failures during update', async () => {
            employeeModel.updateEmployee.mockRejectedValue(new Error('Update Failed'));

            const result = await employeeBulkOperationService.updateEmployees(testFilePath, 'tenant-1', 'camp-1');

            expect(result.summary.total).toBe(1);
            expect(result.summary.success).toBe(0);
            expect(result.summary.failed).toBe(1);
            // The service returns fileBuffer instead of errors directly when there are failures
            expect(result.fileBuffer).toBeDefined();
        });
    });
});
