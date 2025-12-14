/**
 * Unit Tests: Authentication Controller
 * Tests for login, register, and password management
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock models
const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
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
const authController = await import('../../src/controllers/authentication.controller.js');

describe('Authentication Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('login()', () => {
    it('should return user data from passport on successful login', () => {
      const userData = {
        user_id: 1,
        tenant_id: 1,
        username: 'testuser',
        access_token: 'Bearer mock-token',
      };
      req.user = userData;
      
      authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(userData);
    });

    it('should return user with tenant info', () => {
      const userData = {
        user_id: 1,
        tenant_id: 1,
        username: 'testuser',
        tenant: {
          tenant_id: 1,
          tenant_name: 'Test Tenant',
        },
      };
      req.user = userData;
      
      authController.login(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: expect.objectContaining({
            tenant_id: 1,
          }),
        })
      );
    });
  });

  describe('register()', () => {
    it('should return 400 if no tenant_id or tenant_code provided', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      
      await authController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Tenant'),
        })
      );
    });

    it('should return 400 if tenant_code is invalid', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        tenant_code: 'INVALID',
      };
      
      mockTenant.findOne.mockResolvedValue(null);
      
      await authController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid tenant code',
      });
    });

    it('should return 409 if email already exists', async () => {
      req.body = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        tenant_id: 1,
      };
      
      mockUser.findOne.mockResolvedValueOnce({ email: 'existing@example.com' });
      
      await authController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already registered',
      });
    });

    it('should return 409 if username already exists', async () => {
      req.body = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
        tenant_id: 1,
      };
      
      // First findOne for email returns null
      mockUser.findOne.mockResolvedValueOnce(null);
      // Second findOne for username returns existing user
      mockUser.findOne.mockResolvedValueOnce({ username: 'existinguser' });
      
      await authController.register(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username already taken',
      });
    });

    it('should default to user role when registering', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        tenant_id: 1,
      };
      
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 2,
        username: 'newuser',
        email: 'new@example.com',
        role: 'user',
        tenant_id: 1,
      });
      
      await authController.register(req, res, next);
      
      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
    });

    it('should create user successfully with valid data', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        tenant_id: 1,
      };
      
      const createdUser = {
        user_id: 1,
        username: 'newuser',
        email: 'new@example.com',
        tenant_id: 1,
        toAuthJSON: () => ({
          user_id: 1,
          username: 'newuser',
          access_token: 'Bearer token',
        }),
      };
      
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue(createdUser);
      
      await authController.register(req, res, next);
      
      expect(mockUser.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should lookup tenant by code if provided', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        tenant_code: 'TENANT123',
      };
      
      mockTenant.findOne.mockResolvedValue({
        tenant_id: 5,
        tenant_code: 'TENANT123',
        is_active: true,
      });
      
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        user_id: 1,
        tenant_id: 5,
        toAuthJSON: () => ({ user_id: 1 }),
      });
      
      await authController.register(req, res, next);
      
      expect(mockTenant.findOne).toHaveBeenCalledWith({
        where: { tenant_code: 'TENANT123', is_active: true },
      });
    });
  });

  describe('validation schemas', () => {
    describe('login validation', () => {
      const { login } = authController.validation;
      
      it('should require username', () => {
        const { error } = login.body.validate({ password: 'test' });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('username');
      });

      it('should require password', () => {
        const { error } = login.body.validate({ username: 'test' });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });

      it('should pass with valid credentials', () => {
        const { error } = login.body.validate({
          username: 'testuser',
          password: 'password123',
        });
        expect(error).toBeUndefined();
      });
    });

    describe('register validation', () => {
      const { register } = authController.validation;
      
      it('should require email', () => {
        const { error } = register.body.validate({
          username: 'test',
          password: 'password123',
        });
        expect(error).toBeDefined();
      });

      it('should validate email format', () => {
        const { error } = register.body.validate({
          username: 'test',
          email: 'notanemail',
          password: 'password123',
        });
        expect(error).toBeDefined();
      });

      it('should require minimum password length', () => {
        const { error } = register.body.validate({
          username: 'test',
          email: 'test@example.com',
          password: '12345', // Only 5 chars
        });
        expect(error).toBeDefined();
      });

      it('should pass with valid data', () => {
        const { error } = register.body.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
        expect(error).toBeUndefined();
      });
    });
  });
});
