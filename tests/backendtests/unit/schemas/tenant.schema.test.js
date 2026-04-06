const tenantSchema = require('@/schemas/tenant.schema');

describe('Tenant Schema', () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const campusId = '550e8400-e29b-41d4-a716-446655440001';
  const username = 'admin';

  describe('registerTenant', () => {
    const validBody = {
      tenantName: 'Test School',
      subdomain: 'test-school',
      tenantPhone: '9876543210',
      yearFounded: 2000,
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      adminFirstName: 'John',
      adminLastName: 'Doe',
      adminPhone: '+919876543210',
      adminDOB: '1990-01-01',
      campusName: 'Main Campus',
      campusAddress: '123 Street',
      campusNoOfFloors: 2
    };

    test('body valid', () => {
      const { error } = tenantSchema.registerTenant.body.validate(validBody);
      expect(error).toBeUndefined();
    });

    test('invalid subdomain', () => {
      const { error } = tenantSchema.registerTenant.body.validate({ ...validBody, subdomain: 'invalid subdomain' });
      expect(error).toBeDefined();
    });

    test('invalid logo url', () => {
      const { error } = tenantSchema.registerTenant.body.validate({ ...validBody, logoUrl: 'not-a-url' });
      expect(error).toBeDefined();
    });
  });

  describe('getTenantBySubdomain', () => {
    test('params valid', () => {
      const { error } = tenantSchema.getTenantBySubdomain.params.validate({ subdomain: 'test-school' });
      expect(error).toBeUndefined();
    });
  });

  describe('checkSubdomainAvailability', () => {
    test('params valid', () => {
      const { error } = tenantSchema.checkSubdomainAvailability.params.validate({ subdomain: 'test' });
      expect(error).toBeUndefined();
    });
  });

  describe('getTenantById', () => {
    test('user and params valid', () => {
      const userRes = tenantSchema.getTenantById.user.validate({ tenantId, campusId, username });
      const paramsRes = tenantSchema.getTenantById.params.validate({ tenantId });
      expect(userRes.error).toBeUndefined();
      expect(paramsRes.error).toBeUndefined();
    });
  });

  describe('updateTenant', () => {
    test('body valid', () => {
      const body = { tenant_name: 'Updated School' };
      const { error } = tenantSchema.updateTenant.body.validate(body);
      expect(error).toBeUndefined();
    });
  });
});
