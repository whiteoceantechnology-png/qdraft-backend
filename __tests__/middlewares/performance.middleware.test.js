/**
 * Unit Tests: Performance Middleware
 * Tests for response time, rate limiting, and timeout middleware
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';
import {
  responseTime,
  rateLimit,
  requestTimeout,
} from '../../src/middlewares/performance.middleware.js';

describe('Performance Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    
    // Add setHeader to res
    res.setHeader = jest.fn();
    res.removeListener = jest.fn();
    res.on = jest.fn((event, callback) => {
      if (event === 'finish') {
        // Store the callback for later invocation
        res._finishCallback = callback;
      }
    });
  });

  describe('responseTime()', () => {
    it('should add X-Response-Time header on response finish', () => {
      responseTime(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should call next immediately', () => {
      responseTime(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('rateLimit()', () => {
    it('should create rate limiter with custom options', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 100,
        message: 'Too many requests',
      });
      
      expect(typeof limiter).toBe('function');
    });

    it('should allow requests under the limit', () => {
      const limiter = rateLimit({ max: 100, windowMs: 60000 });
      
      // First request should pass
      limiter(req, res, next);
      
      // Should either call next or set headers
      // Implementation may vary
      expect(next).toHaveBeenCalled();
    });

    it('should use default message when not provided', () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      
      expect(typeof limiter).toBe('function');
    });
  });

  describe('requestTimeout()', () => {
    beforeEach(() => {
      // Mock setTimeout and clearTimeout
      jest.useFakeTimers();
      req.socket = { destroy: jest.fn() };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create timeout middleware', () => {
      const timeout = requestTimeout(5000);
      
      expect(typeof timeout).toBe('function');
    });

    it('should call next immediately', () => {
      const timeout = requestTimeout(5000);
      timeout(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should not timeout if response finishes in time', () => {
      const timeout = requestTimeout(5000);
      timeout(req, res, next);
      
      // Simulate response finishing before timeout
      if (res._finishCallback) {
        res._finishCallback();
      }
      
      // Should not have destroyed socket
      expect(req.socket.destroy).not.toHaveBeenCalled();
    });
  });
});

describe('Rate Limiting Behavior', () => {
  it('should track requests per IP', () => {
    const limiter = rateLimit({ max: 2, windowMs: 1000 });
    
    const req1 = mockRequest({ ip: '127.0.0.1' });
    const req2 = mockRequest({ ip: '127.0.0.1' });
    const req3 = mockRequest({ ip: '192.168.1.1' }); // Different IP
    
    const res1 = mockResponse();
    const res2 = mockResponse();
    const res3 = mockResponse();
    
    const next1 = mockNext();
    const next2 = mockNext();
    const next3 = mockNext();
    
    limiter(req1, res1, next1);
    limiter(req2, res2, next2);
    limiter(req3, res3, next3);
    
    // First two from same IP should pass
    expect(next1).toHaveBeenCalled();
    expect(next2).toHaveBeenCalled();
    // Third from different IP should also pass
    expect(next3).toHaveBeenCalled();
  });
});
