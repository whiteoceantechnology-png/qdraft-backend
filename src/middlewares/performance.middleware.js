/**
 * Performance Middleware
 * Request timing, rate limiting, and response optimization
 */

import HTTPStatus from 'http-status';

// Rate limit storage (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Request timing middleware - adds X-Response-Time header
 * Sets header before response is sent by intercepting res.end
 */
export function responseTime(req, res, next) {
  const start = process.hrtime.bigint();
  
  // Store original end function
  const originalEnd = res.end.bind(res);
  
  // Override end to set header before sending
  res.end = function(...args) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds
    
    // Only set header if not already sent
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    
    // Log slow requests (> 500ms) in development
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.warn(`[SLOW] ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }
    
    // Call original end
    return originalEnd(...args);
  };
  
  next();
}

/**
 * Rate limiting middleware factory
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} options.message - Error message
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 100,        // 100 requests per minute
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
  } = options;
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    if (record.count > max) {
      return res.status(HTTPStatus.TOO_MANY_REQUESTS).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }
    
    next();
  };
}

/**
 * Strict rate limit for auth endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.username || 'unknown'}`,
});

/**
 * General API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 120,              // 120 requests per minute
  message: 'API rate limit exceeded',
});

/**
 * Request timeout middleware
 * @param {number} timeout - Timeout in milliseconds
 */
export function requestTimeout(timeout = 30000) {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(HTTPStatus.REQUEST_TIMEOUT).json({
          success: false,
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out',
        });
      }
    });
    next();
  };
}

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export default {
  responseTime,
  rateLimit,
  authRateLimit,
  apiRateLimit,
  requestTimeout,
};
