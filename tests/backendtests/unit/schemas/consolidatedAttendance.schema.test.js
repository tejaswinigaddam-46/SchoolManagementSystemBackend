const { getConsolidatedAttendance } = require('@/schemas/consolidatedAttendance.schema');

describe('Consolidated Attendance Schema Validation', () => {
    describe('getConsolidatedAttendance.user', () => {
        it('should validate a valid user context', () => {
            const validData = {
                tenantId: 'tenant-123',
                campusId: '123e4567-e89b-12d3-a456-426614174000',
                extraField: 'should be ignored'
            };
            const { error, value } = getConsolidatedAttendance.user.validate(validData);
            expect(error).toBeUndefined();
            expect(value.extraField).toBe('should be ignored'); // Tests unknown(true)
        });

        it('should invalidate missing tenantId', () => {
            const invalidData = {
                campusId: '123e4567-e89b-12d3-a456-426614174000'
            };
            const { error } = getConsolidatedAttendance.user.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].context.key).toBe('tenantId');
        });

        it('should invalidate missing campusId', () => {
            const invalidData = {
                tenantId: 'tenant-123'
            };
            const { error } = getConsolidatedAttendance.user.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.details[0].context.key).toBe('campusId');
        });
        
        it('should invalidate "undefined" as a string', () => {
            const invalidData = {
                tenantId: 'undefined',
                campusId: '123e4567-e89b-12d3-a456-426614174000'
            };
            const { error } = getConsolidatedAttendance.user.validate(invalidData);
            expect(error).toBeDefined();
        });
    });

    describe('getConsolidatedAttendance.body', () => {
        it('should validate valid body payload', () => {
            const validData = {
                roles: ['Student', 'Teacher'],
                academicYear: '2023-2024',
                fromDate: '2023-10-01',
                toDate: '2023-10-31',
                classId: 10,
                sectionId: 'A'
            };
            const { error } = getConsolidatedAttendance.body.validate(validData);
            expect(error).toBeUndefined();
        });

        it('should invalidate missing fromDate', () => {
            const invalidData = {
                toDate: '2023-10-31'
            };
            const { error } = getConsolidatedAttendance.body.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.message).toBe('fromDate is required');
        });

        it('should invalidate missing toDate', () => {
            const invalidData = {
                fromDate: '2023-10-01'
            };
            const { error } = getConsolidatedAttendance.body.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.message).toBe('toDate is required');
        });

        it('should invalidate incorrect date format', () => {
            const invalidData = {
                fromDate: 'not-a-date',
                toDate: '2023-10-31'
            };
            const { error } = getConsolidatedAttendance.body.validate(invalidData);
            expect(error).toBeDefined();
            expect(error.message).toBe('"fromDate" must be in ISO 8601 date format');
        });

        it('should allow optional fields to be empty/null', () => {
            const validData = {
                fromDate: '2023-10-01',
                toDate: '2023-10-31',
                academicYear: null,
                classId: '',
                sectionId: null
            };
            const { error } = getConsolidatedAttendance.body.validate(validData);
            expect(error).toBeUndefined();
        });
    });
});
