const { exportStudents, uploadStudents, updateStudents } = require('@/schemas/studentBulkOperation.schema');

describe('Student Bulk Operation Schema Validation', () => {
    describe('exportStudents', () => {
        it('should validate valid body with usernames', () => {
            const { error } = exportStudents.body.validate({ usernames: ['stu1', 'stu2'] });
            expect(error).toBeUndefined();
        });

        it('should invalidate empty usernames array', () => {
            const { error } = exportStudents.body.validate({ usernames: [] });
            expect(error).toBeDefined();
            expect(error.message).toBe('No students selected for export');
        });

        it('should invalidate missing usernames', () => {
            const { error } = exportStudents.body.validate({});
            expect(error).toBeDefined();
            expect(error.message).toBe('No students selected for export');
        });
    });

    describe('uploadStudents', () => {
        it('should validate valid user context', () => {
            const validUser = {
                tenantId: 'tenant-123',
                campusId: '123e4567-e89b-12d3-a456-426614174000',
                role: 'Admin'
            };
            const { error } = uploadStudents.user.validate(validUser);
            expect(error).toBeUndefined();
        });

        it('should validate valid file path', () => {
            const { error } = uploadStudents.file.validate({ path: '/tmp/upload.xlsx' });
            expect(error).toBeUndefined();
        });

        it('should invalidate missing file path', () => {
            const { error } = uploadStudents.file.validate({});
            expect(error).toBeDefined();
            expect(error.message).toBe('No file uploaded or file path missing');
        });

        it('should validate body with optional campusId', () => {
            const { error } = uploadStudents.body.validate({ campusId: '123' });
            expect(error).toBeUndefined();
        });
    });

    describe('updateStudents', () => {
        it('should validate valid file path', () => {
            const { error } = updateStudents.file.validate({ path: '/tmp/update.xlsx', fieldname: 'file' });
            expect(error).toBeUndefined();
        });
        
        it('should invalidate missing file path', () => {
            const { error } = updateStudents.file.validate({});
            expect(error).toBeDefined();
        });
    });
});
