const { exportEmployees, uploadEmployees, updateEmployees } = require('@/schemas/employeeBulkOperation.schema');

describe('Employee Bulk Operation Schema Validation', () => {
    describe('exportEmployees', () => {
        it('should validate valid body with usernames', () => {
            const { error } = exportEmployees.body.validate({ usernames: ['emp1', 'emp2'] });
            expect(error).toBeUndefined();
        });

        it('should invalidate empty usernames array', () => {
            const { error } = exportEmployees.body.validate({ usernames: [] });
            expect(error).toBeDefined();
            expect(error.message).toBe('No employees selected for export');
        });

        it('should invalidate missing usernames', () => {
            const { error } = exportEmployees.body.validate({});
            expect(error).toBeDefined();
            expect(error.message).toBe('No employees selected for export');
        });
    });

    describe('uploadEmployees', () => {
        it('should validate valid user context', () => {
            const validUser = {
                tenantId: 'tenant-123',
                campusId: '123e4567-e89b-12d3-a456-426614174000',
                role: 'Admin'
            };
            const { error } = uploadEmployees.user.validate(validUser);
            expect(error).toBeUndefined();
        });

        it('should validate valid file path', () => {
            const { error } = uploadEmployees.file.validate({ path: '/tmp/upload.xlsx' });
            expect(error).toBeUndefined();
        });

        it('should invalidate missing file path', () => {
            const { error } = uploadEmployees.file.validate({});
            expect(error).toBeDefined();
            expect(error.message).toBe('No file uploaded or file path missing');
        });

        it('should validate body with optional campusId', () => {
            const { error } = uploadEmployees.body.validate({ campusId: '123' });
            expect(error).toBeUndefined();
        });
    });

    describe('updateEmployees', () => {
        it('should validate valid file path', () => {
            const { error } = updateEmployees.file.validate({ path: '/tmp/update.xlsx', fieldname: 'file' });
            expect(error).toBeUndefined();
        });
        
        it('should invalidate missing file path', () => {
            const { error } = updateEmployees.file.validate({});
            expect(error).toBeDefined();
        });
    });
});
