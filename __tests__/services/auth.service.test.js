/**
 * Unit Tests: Auth Service
 * Tests for authentication middleware (mocked)
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock passport before importing auth service
jest.unstable_mockModule('passport', () => ({
  default: {
    authenticate: jest.fn(),
    use: jest.fn(),
  },
}));

// Mock the models
jest.unstable_mockModule('../../src/models/index.js', () => ({
  User: {
    findOne: jest.fn(),
  },
  Tenant: {},
}));

// Import after mocking
const { authJwt } = await import('../../src/services/auth.js');
const passport = (await import('passport')).default;

describe('Auth Service', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('authJwt middleware', () => {
    it('should return 401 if no authorization header', () => {
      req.headers = {};
      
      authJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization token is required',
        code: 'TOKEN_REQUIRED',
      });
    });

    it('should return 401 if token format is invalid (not Bearer)', () => {
      req.headers = { authorization: 'Basic token' };
      
      authJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT',
      });
    });

    it('should call passport authenticate with valid Bearer format', () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      // Mock passport.authenticate to return a function
      passport.authenticate.mockReturnValue((req, res, next) => {
        next();
      });
      
      authJwt(req, res, next);
      
      expect(passport.authenticate).toHaveBeenCalledWith(
        'jwt',
        { session: false },
        expect.any(Function)
      );
    });
  });

  describe('Token validation edge cases', () => {
    it('should reject empty authorization header', () => {
      req.headers = { authorization: '' };
      
      authJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject whitespace-only authorization', () => {
      req.headers = { authorization: '   ' };
      
      authJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject Bearer without token', () => {
      req.headers = { authorization: 'Bearer ' };
      
      // This passes format check, passport handles empty token
      passport.authenticate.mockReturnValue((req, res, next) => {
        res.status(401).json({ success: false, message: 'Invalid token' });
      });
      
      authJwt(req, res, next);
      
      expect(passport.authenticate).toHaveBeenCalled();
    });
  });
});
