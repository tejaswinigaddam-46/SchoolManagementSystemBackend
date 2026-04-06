const tenantService = require('@/services/tenant.service');
const tenantModel = require('@/models/tenant.model');

jest.mock('@/models/tenant.model');

describe('Tenant Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerTenant', () => {
    const validData = {
      tenantName: 'Test School',
      subdomain: 'test-school',
      tenantPhone: '9876543210',
      yearFounded: 2000,
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      adminFirstName: 'John',
      adminMiddleName: '',
      adminLastName: 'Doe',
      adminPhone: '+919876543210',
      adminDOB: '1990-01-01',
      campusName: 'Main Campus',
      campusAddress: '123 Street',
      campusPhone: '0123456789',
      campusEmail: 'campus@example.com',
      campusYearEstablished: 2005,
      campusNoOfFloors: 2
    };

    test('registerTenant success', async () => {
      tenantModel.checkSubdomainExists.mockResolvedValue(false);
      const mockResult = {
        tenant: { tenant_id: 't1' },
        admin: { user_id: 'u1' },
        campus: { campus_id: 'c1' }
      };
      tenantModel.createTenantWithSuperadmin.mockResolvedValue(mockResult);

      const res = await tenantService.registerTenant(validData);
      expect(res).toEqual({
        tenant: mockResult.tenant,
        admin: mockResult.admin,
        campusId: 'c1'
      });
    });

    test('registerTenant subdomain taken', async () => {
      tenantModel.checkSubdomainExists.mockResolvedValue(true);
      await expect(tenantService.registerTenant(validData)).rejects.toThrow('Subdomain is already taken');
    });

    test('registerTenant propagates error from model', async () => {
      tenantModel.checkSubdomainExists.mockResolvedValue(false);
      tenantModel.createTenantWithSuperadmin.mockRejectedValue(new Error('DB Error'));
      await expect(tenantService.registerTenant(validData)).rejects.toThrow('DB Error');
    });
  });

  describe('getTenantBySubdomain', () => {
    test('getTenantBySubdomain returns data', async () => {
      const mockTenant = { tenant_id: 't1' };
      tenantModel.findTenantBySubdomain.mockResolvedValue(mockTenant);
      const res = await tenantService.getTenantBySubdomain('test');
      expect(res).toEqual(mockTenant);
    });
  });

  describe('getTenantById', () => {
    test('getTenantById returns data', async () => {
      const mockTenant = { tenant_id: 't1' };
      tenantModel.findTenantById.mockResolvedValue(mockTenant);
      const res = await tenantService.getTenantById('t1');
      expect(res).toEqual(mockTenant);
    });
  });

  describe('getAllTenants', () => {
    test('getAllTenants returns list', async () => {
      const mockList = [{ tenant_id: 't1' }];
      tenantModel.getAllTenants.mockResolvedValue(mockList);
      const res = await tenantService.getAllTenants();
      expect(res).toEqual(mockList);
    });
  });

  describe('updateTenant', () => {
    test('updateTenant success', async () => {
      const mockTenant = { tenant_id: 't1' };
      tenantModel.findTenantById.mockResolvedValue(mockTenant);
      tenantModel.updateTenant.mockResolvedValue({ ...mockTenant, tenant_name: 'Updated' });
      const res = await tenantService.updateTenant('t1', { tenant_name: 'Updated' });
      expect(res.tenant_name).toBe('Updated');
    });

    test('updateTenant not found', async () => {
      tenantModel.findTenantById.mockResolvedValue(null);
      await expect(tenantService.updateTenant('t1', {})).rejects.toThrow('Tenant not found');
    });
  });

  describe('getTenantStatistics', () => {
    test('getTenantStatistics success', async () => {
      const mockTenant = { tenant_id: 't1', tenant_name: 'T1', subdomain: 's1' };
      const mockStats = { user_count: 10 };
      tenantModel.findTenantById.mockResolvedValue(mockTenant);
      tenantModel.getTenantStatistics.mockResolvedValue(mockStats);
      const res = await tenantService.getTenantStatistics('t1');
      expect(res.tenant_info.tenant_id).toBe('t1');
      expect(res.statistics).toEqual(mockStats);
    });

    test('getTenantStatistics not found', async () => {
      tenantModel.findTenantById.mockResolvedValue(null);
      await expect(tenantService.getTenantStatistics('t1')).rejects.toThrow('Tenant not found');
    });
  });

  describe('checkSubdomainAvailability', () => {
    test('available', async () => {
      tenantModel.checkSubdomainExists.mockResolvedValue(false);
      const res = await tenantService.checkSubdomainAvailability('valid-sub');
      expect(res.available).toBe(true);
    });

    test('taken', async () => {
      tenantModel.checkSubdomainExists.mockResolvedValue(true);
      const res = await tenantService.checkSubdomainAvailability('taken');
      expect(res.available).toBe(false);
    });

    test('invalid format', async () => {
      const res = await tenantService.checkSubdomainAvailability('invalid subdomain');
      expect(res.available).toBe(false);
      expect(res.message).toContain('Subdomain must contain only lowercase letters');
    });
  });

  describe('checkEmailAvailability', () => {
    test('available', async () => {
      tenantModel.checkEmailExists.mockResolvedValue(false);
      const res = await tenantService.checkEmailAvailability('test@example.com');
      expect(res.available).toBe(true);
    });

    test('taken', async () => {
      tenantModel.checkEmailExists.mockResolvedValue(true);
      const res = await tenantService.checkEmailAvailability('taken@example.com');
      expect(res.available).toBe(false);
    });
  });
});
