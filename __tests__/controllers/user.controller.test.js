/**
 * Unit Tests: User Controller
 * Tests for user CRUD with role-based authorization
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock models
const mockUser = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
};

const mockTenant = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  User: mockUser,
  Tenant: mockTenant,
}));

// Import after mocking
const userController = await import('../../src/controllers/user.controller.js');

describe('User Controller - Role-Based Authorization', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('create() - Super Admin', () => {
    beforeEach(() => {
      req.user = {
        user_id: 1,
        role: 'super_admin',
        tenant_id: 1,
      };
    });

    it('should allow super_admin to create another super_admin', async () => {
      req.body = {
        username: 'newadmin',
        email: 'admin@example.com',
        password: 'securepass123',
        role: 'super_admin',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 2,
        username: 'newadmin',
        email: 'admin@example.com',
        role: 'super_admin',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'super_admin',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should allow super_admin to create tenant_admin', async () => {
      req.body = {
        username: 'tenantadmin',
        email: 'tadmin@example.com',
        password: 'securepass123',
        role: 'tenant_admin',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 2,
        username: 'tenantadmin',
        email: 'tadmin@example.com',
        role: 'tenant_admin',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'tenant_admin',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should allow super_admin to create teacher', async () => {
      req.body = {
        username: 'teacher1',
        email: 'teacher@example.com',
        password: 'securepass123',
        role: 'teacher',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 2,
        username: 'teacher1',
        email: 'teacher@example.com',
        role: 'teacher',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'teacher',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should allow super_admin to create regular user', async () => {
      req.body = {
        username: 'regularuser',
        email: 'user@example.com',
        password: 'securepass123',
        role: 'user',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 2,
        username: 'regularuser',
        email: 'user@example.com',
        role: 'user',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('create() - Tenant Admin', () => {
    beforeEach(() => {
      req.user = {
        user_id: 2,
        role: 'tenant_admin',
        tenant_id: 1,
      };
    });

    it('should allow tenant_admin to create teacher', async () => {
      req.body = {
        username: 'teacher1',
        email: 'teacher@example.com',
        password: 'securepass123',
        role: 'teacher',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 3,
        username: 'teacher1',
        email: 'teacher@example.com',
        role: 'teacher',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'teacher',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should allow tenant_admin to create regular user', async () => {
      req.body = {
        username: 'regularuser',
        email: 'user@example.com',
        password: 'securepass123',
        role: 'user',
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 3,
        username: 'regularuser',
        email: 'user@example.com',
        role: 'user',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject tenant_admin creating super_admin', async () => {
      req.body = {
        username: 'newadmin',
        email: 'admin@example.com',
        password: 'securepass123',
        role: 'super_admin',
      };

      await userController.create(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden: Tenant admins can only create user or teacher roles',
      });
    });

    it('should reject tenant_admin creating another tenant_admin', async () => {
      req.body = {
        username: 'anothertadmin',
        email: 'tadmin2@example.com',
        password: 'securepass123',
        role: 'tenant_admin',
      };

      await userController.create(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden: Tenant admins can only create user or teacher roles',
      });
    });

    it('should default to user role if not specified', async () => {
      req.body = {
        username: 'defaultuser',
        email: 'default@example.com',
        password: 'securepass123',
        // role not specified
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 3,
        username: 'defaultuser',
        email: 'default@example.com',
        role: 'user',
        tenant_id: 1,
      });

      await userController.create(req, res);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('create() - Validation', () => {
    beforeEach(() => {
      req.user = {
        user_id: 1,
        role: 'super_admin',
        tenant_id: 1,
      };
    });

    it('should reject duplicate username', async () => {
      req.body = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'securepass123',
      };

      mockUser.findOne.mockResolvedValue({
        user_id: 99,
        username: 'existinguser',
      });

      await userController.create(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username or email already exists',
      });
    });

    it('should reject duplicate email', async () => {
      req.body = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'securepass123',
      };

      mockUser.findOne.mockResolvedValue({
        user_id: 99,
        email: 'existing@example.com',
      });

      await userController.create(req, res);

      expect(mockUser.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username or email already exists',
      });
    });
  });

  describe('list() - Tenant Scoping', () => {
    it('should return all users for super_admin', async () => {
      req.user = {
        user_id: 1,
        role: 'super_admin',
        tenant_id: 1,
      };
      req.query = {};

      mockUser.findAll.mockResolvedValue([
        { user_id: 2, username: 'user1', tenant_id: 1 },
        { user_id: 3, username: 'user2', tenant_id: 2 },
      ]);
      mockUser.count.mockResolvedValue(2);

      await userController.list(req, res);

      expect(mockUser.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ username: 'user1' }),
            expect.objectContaining({ username: 'user2' }),
          ]),
        })
      );
    });

    it('should return only tenant users for tenant_admin', async () => {
      req.user = {
        user_id: 2,
        role: 'tenant_admin',
        tenant_id: 1,
      };
      req.query = {};
      req.tenant_id = 1; // Set by tenant middleware

      mockUser.findAll.mockResolvedValue([
        { user_id: 2, username: 'user1', tenant_id: 1 },
        { user_id: 3, username: 'user2', tenant_id: 1 },
      ]);
      mockUser.count.mockResolvedValue(2);

      await userController.list(req, res);

      expect(mockUser.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: 1,
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
