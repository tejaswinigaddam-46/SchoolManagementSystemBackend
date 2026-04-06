const schema = require('@/schemas/fee.schema');

describe('Fee Schema', () => {
  const tenantId = 'tenant-123';
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 1;
  const studentId = '550e8400-e29b-41d4-a716-446655440001';
  const feeTypeId = '550e8400-e29b-41d4-a716-446655440002';
  const feeStructureId = '550e8400-e29b-41d4-a716-446655440003';

  const validUserContext = { tenantId, campusId };
  const validTenantContext = { tenantId };
  const validUserContextWithUserId = { tenantId, campusId, userId };

  describe('createFeeType', () => {
    test('valid body', () => {
      const { error } = schema.createFeeType.body.validate({
        fee_type_name: 'Annual Tuition',
        description: 'Yearly tuition fees'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateFeeType', () => {
    test('valid params and body', () => {
      const { error: paramsError } = schema.updateFeeType.params.validate({ id: feeTypeId });
      const { error: bodyError } = schema.updateFeeType.body.validate({
        fee_type_name: 'Updated Name'
      });
      expect(paramsError).toBeUndefined();
      expect(bodyError).toBeUndefined();
    });
  });

  describe('createFeeStructure', () => {
    const validBody = {
      academic_year_id: 1,
      class_id: 10,
      fee_type_id: feeTypeId,
      total_amount: 5000,
      installments: [
        {
          installment_name: 'Term 1',
          due_date: '2026-06-01',
          amount: 2500
        }
      ]
    };

    test('valid body with class_id', () => {
      const { error } = schema.createFeeStructure.body.validate(validBody);
      expect(error).toBeUndefined();
    });

    test('valid body with class_name', () => {
      const { error } = schema.createFeeStructure.body.validate({
        ...validBody,
        class_id: undefined,
        class_name: 'Grade 1'
      });
      expect(error).toBeUndefined();
    });

    test('invalid if both class_id and class_name missing', () => {
      const { error } = schema.createFeeStructure.body.validate({
        ...validBody,
        class_id: undefined
      });
      expect(error).toBeDefined();
    });
  });

  describe('collectPayment', () => {
    test('valid body with student_id', () => {
      const { error } = schema.collectPayment.body.validate({
        student_id: studentId,
        total_amount_received: 1000,
        payment_method: 'Cash'
      });
      expect(error).toBeUndefined();
    });

    test('valid body with student_username', () => {
      const { error } = schema.collectPayment.body.validate({
        student_username: 'student123',
        total_amount_received: 1000,
        payment_method: 'Online'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('generateDuesForClass', () => {
    test('valid body', () => {
      const { error } = schema.generateDuesForClass.body.validate({
        academic_year_id: 1,
        class_id: 10
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getStudentFeeDues', () => {
    test('valid query', () => {
      const { error } = schema.getStudentFeeDues.query.validate({
        campus_id: campusId,
        student_id: studentId,
        academic_year_id: 1
      });
      expect(error).toBeUndefined();
    });
  });
});
