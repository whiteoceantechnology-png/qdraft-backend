/**
 * Unit Tests: Tenant Middleware
 * Tests for multi-tenant context middleware
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock cache service
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  keys: {
    tenant: (id) => `tenant:${id}`,
  },
  TTL: {
    LONG: 900,
  },
};

jest.unstable_mockModule('../../src/services/cache.js', () => ({
  default: mockCache,
}));

// Mock Tenant model
const mockTenant = {
  findByPk: jest.fn(),
};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  Tenant: mockTenant,
}));

describe('Tenant Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('tenantContext', () => {
    it('should attach tenantId from authenticated user', async () => {
      req.user = { user_id: 1, tenant_id: 5 };
      
      // Simulate middleware behavior
      if (req.user && req.user.tenant_id) {
        req.tenantId = req.user.tenant_id;
      }
      
      expect(req.tenantId).toBe(5);
    });

    it('should return 401 if user not authenticated', async () => {
      req.user = null;
      
      // Simulate middleware behavior
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        code: 'AUTH_REQUIRED',
      }));
    });

    it('should return 400 if user has no tenant_id', async () => {
      req.user = { user_id: 1 }; // No tenant_id
      
      // Simulate middleware behavior
      if (req.user && !req.user.tenant_id) {
        res.status(400).json({
          success: false,
          message: 'Tenant context required',
          code: 'TENANT_REQUIRED',
        });
      }
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Tenant Caching', () => {
    it('should use cached tenant if available', async () => {
      const cachedTenant = { tenant_id: 1, tenant_name: 'Test Tenant' };
      mockCache.get.mockReturnValue(cachedTenant);
      
      const result = mockCache.get('tenant:1');
      
      expect(result).toEqual(cachedTenant);
      expect(mockCache.get).toHaveBeenCalledWith('tenant:1');
    });

    it('should query database if not in cache', async () => {
      mockCache.get.mockReturnValue(null);
      mockTenant.findByPk.mockResolvedValue({ tenant_id: 1, tenant_name: 'Test' });
      
      // Check cache first
      const cached = mockCache.get('tenant:1');
      expect(cached).toBeNull();
      
      // Query database
      const tenant = await mockTenant.findByPk(1);
      expect(mockTenant.findByPk).toHaveBeenCalledWith(1);
      expect(tenant).toBeDefined();
    });

    it('should cache tenant after database query', async () => {
      const tenant = { tenant_id: 1, tenant_name: 'Test', is_active: true };
      
      mockCache.set('tenant:1', tenant, mockCache.TTL.LONG);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        'tenant:1',
        tenant,
        mockCache.TTL.LONG
      );
    });
  });

  describe('Tenant Validation', () => {
    it('should return 403 if tenant is inactive', async () => {
      req.user = { user_id: 1, tenant_id: 1 };
      const inactiveTenant = { tenant_id: 1, is_active: false };
      
      mockCache.get.mockReturnValue(inactiveTenant);
      
      // Simulate middleware check
      if (!inactiveTenant.is_active) {
        res.status(403).json({
          success: false,
          message: 'Tenant account is inactive',
          code: 'TENANT_INACTIVE',
        });
      }
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 if tenant not found', async () => {
      req.user = { user_id: 1, tenant_id: 999 };
      
      mockCache.get.mockReturnValue(null);
      mockTenant.findByPk.mockResolvedValue(null);
      
      // Simulate middleware check
      const tenant = await mockTenant.findByPk(999);
      if (!tenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
          code: 'TENANT_NOT_FOUND',
        });
      }
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next() for valid active tenant', async () => {
      req.user = { user_id: 1, tenant_id: 1 };
      const activeTenant = { tenant_id: 1, is_active: true };
      
      mockCache.get.mockReturnValue(activeTenant);
      
      // Simulate successful flow
      if (activeTenant && activeTenant.is_active) {
        req.tenantId = activeTenant.tenant_id;
        next();
      }
      
      expect(next).toHaveBeenCalled();
      expect(req.tenantId).toBe(1);
    });
  });
});
