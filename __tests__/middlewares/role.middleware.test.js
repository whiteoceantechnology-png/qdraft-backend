/**
 * Unit Tests: Role Middleware
 * Tests for role-based authorization
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Import the middleware functions
const roleMiddleware = await import('../../src/middlewares/role.middleware.js');

describe('Role Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('requireRole()', () => {
    it('should allow user with correct role', () => {
      req.user = { user_id: 1, role: 'super_admin' };
      
      const middleware = roleMiddleware.requireRole(['super_admin']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user with any of the allowed roles', () => {
      req.user = { user_id: 1, role: 'tenant_admin' };
      
      const middleware = roleMiddleware.requireRole(['super_admin', 'tenant_admin']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      req.user = { user_id: 1, role: 'user' };
      
      const middleware = roleMiddleware.requireRole(['super_admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      req.user = null;
      
      const middleware = roleMiddleware.requireRole(['super_admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin()', () => {
    it('should allow super_admin', () => {
      req.user = { user_id: 1, role: 'super_admin' };
      
      roleMiddleware.requireSuperAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject tenant_admin', () => {
      req.user = { user_id: 1, role: 'tenant_admin' };
      
      roleMiddleware.requireSuperAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject teacher', () => {
      req.user = { user_id: 1, role: 'teacher' };
      
      roleMiddleware.requireSuperAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject regular user', () => {
      req.user = { user_id: 1, role: 'user' };
      
      roleMiddleware.requireSuperAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireTenantAdmin()', () => {
    it('should allow super_admin', () => {
      req.user = { user_id: 1, role: 'super_admin' };
      
      roleMiddleware.requireTenantAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow tenant_admin', () => {
      req.user = { user_id: 1, role: 'tenant_admin' };
      
      roleMiddleware.requireTenantAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject teacher', () => {
      req.user = { user_id: 1, role: 'teacher' };
      
      roleMiddleware.requireTenantAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject regular user', () => {
      req.user = { user_id: 1, role: 'user' };
      
      roleMiddleware.requireTenantAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireTeacher()', () => {
    it('should allow super_admin', () => {
      req.user = { user_id: 1, role: 'super_admin' };
      
      roleMiddleware.requireTeacher(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow tenant_admin', () => {
      req.user = { user_id: 1, role: 'tenant_admin' };
      
      roleMiddleware.requireTeacher(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow teacher', () => {
      req.user = { user_id: 1, role: 'teacher' };
      
      roleMiddleware.requireTeacher(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject regular user', () => {
      req.user = { user_id: 1, role: 'user' };
      
      roleMiddleware.requireTeacher(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth()', () => {
    it('should allow any authenticated user with super_admin role', () => {
      req.user = { user_id: 1, role: 'super_admin' };
      
      roleMiddleware.requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow any authenticated user with tenant_admin role', () => {
      req.user = { user_id: 1, role: 'tenant_admin' };
      
      roleMiddleware.requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow any authenticated user with teacher role', () => {
      req.user = { user_id: 1, role: 'teacher' };
      
      roleMiddleware.requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow any authenticated user with user role', () => {
      req.user = { user_id: 1, role: 'user' };
      
      roleMiddleware.requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      req.user = null;
      
      roleMiddleware.requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
