/**
 * Unit Tests: Tenant Controller
 * Tests for tenant CRUD with optional admin creation
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock models
const mockTenant = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
};

// Mock sequelize transaction
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

const mockSequelize = {
  transaction: jest.fn().mockResolvedValue(mockTransaction),
};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  Tenant: mockTenant,
  User: mockUser,
  sequelize: mockSequelize,
}));

// Import after mocking
const tenantController = await import('../../src/controllers/tenant.controller.js');

describe('Tenant Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    req.user = {
      user_id: 1,
      role: 'super_admin',
      tenant_id: 1,
    };
  });

  describe('createTenant() - Without Admin', () => {
    it('should create tenant without admin when admin fields not provided', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
        subscription_plan: 'premium',
        max_users: 100,
      };

      const mockTenantData = {
        tenant_id: 2,
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
      };

      mockTenant.findOne.mockResolvedValue(null);
      mockTenant.create.mockResolvedValue(mockTenantData);

      await tenantController.createTenant(req, res);

      expect(mockTenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_name: 'Test Tenant',
          tenant_code: 'TEST001',
        }),
        expect.any(Object)
      );
      expect(mockUser.create).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tenant created successfully',
        tenant: mockTenantData,
      });
    });
  });

  describe('createTenant() - With Admin', () => {
    it('should create tenant with admin when all admin fields provided', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
        subscription_plan: 'premium',
        max_users: 100,
        admin_username: 'tenant_admin1',
        admin_email: 'admin@test.com',
        admin_password: 'securepass123',
        admin_name: 'John Admin',
      };

      const mockTenantData = {
        tenant_id: 2,
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
      };

      const mockAdminData = {
        user_id: 10,
        tenant_id: 2,
        username: 'tenant_admin1',
        email: 'admin@test.com',
        role: 'tenant_admin',
        user_fname: 'John Admin',
      };

      mockTenant.findOne.mockResolvedValue(null);
      mockTenant.create.mockResolvedValue(mockTenantData);
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue(mockAdminData);

      await tenantController.createTenant(req, res);

      expect(mockTenant.create).toHaveBeenCalled();
      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 2,
          username: 'tenant_admin1',
          email: 'admin@test.com',
          role: 'tenant_admin',
          is_active: true,
        }),
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tenant and admin created successfully',
        tenant: mockTenantData,
        admin: expect.objectContaining({
          username: 'tenant_admin1',
          role: 'tenant_admin',
        }),
      });
    });

    it('should reject if admin username already exists', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
        admin_username: 'existinguser',
        admin_email: 'admin@test.com',
        admin_password: 'securepass123',
      };

      mockTenant.findOne.mockResolvedValue(null);
      mockTenant.create.mockResolvedValue({ tenant_id: 2 });
      mockUser.findOne.mockResolvedValue({
        user_id: 99,
        username: 'existinguser',
      });

      await tenantController.createTenant(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin username or email already exists',
      });
    });

    it('should reject if admin email already exists', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
        admin_username: 'newadmin',
        admin_email: 'existing@test.com',
        admin_password: 'securepass123',
      };

      mockTenant.findOne.mockResolvedValue(null);
      mockTenant.create.mockResolvedValue({ tenant_id: 2 });
      mockUser.findOne.mockResolvedValue({
        user_id: 99,
        email: 'existing@test.com',
      });

      await tenantController.createTenant(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should rollback tenant creation if admin creation fails', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'contact@test.com',
        admin_username: 'tenant_admin1',
        admin_email: 'admin@test.com',
        admin_password: 'securepass123',
      };

      mockTenant.findOne.mockResolvedValue(null);
      mockTenant.create.mockResolvedValue({ tenant_id: 2 });
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockRejectedValue(new Error('Database error'));

      await tenantController.createTenant(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTenant() - Validation', () => {
    it('should reject duplicate tenant code', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'EXISTING',
        email: 'contact@test.com',
      };

      mockTenant.findOne.mockResolvedValue({
        tenant_id: 99,
        tenant_code: 'EXISTING',
      });

      await tenantController.createTenant(req, res);

      expect(mockTenant.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tenant code or email already exists',
      });
    });

    it('should reject duplicate tenant email', async () => {
      req.body = {
        tenant_name: 'Test Tenant',
        tenant_code: 'TEST001',
        email: 'existing@test.com',
      };

      mockTenant.findOne.mockResolvedValue({
        tenant_id: 99,
        email: 'existing@test.com',
      });

      await tenantController.createTenant(req, res);

      expect(mockTenant.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listTenants()', () => {
    it('should return paginated list of tenants', async () => {
      req.query = { page: 1, limit: 10 };

      const mockTenants = [
        { tenant_id: 1, tenant_name: 'Tenant 1', tenant_code: 'T001' },
        { tenant_id: 2, tenant_name: 'Tenant 2', tenant_code: 'T002' },
      ];

      mockTenant.findAll.mockResolvedValue(mockTenants);
      mockTenant.count.mockResolvedValue(2);

      await tenantController.listTenants(req, res);

      expect(mockTenant.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTenants,
          pagination: expect.any(Object),
        })
      );
    });
  });
});
