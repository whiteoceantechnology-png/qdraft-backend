/**
 * Error handler and request logging for API routes
 */

import HTTPStatus from 'http-status';

import logger from '../config/winston.js';
import APIError, { RequiredError } from './error.js';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Request logging middleware (async, non-blocking)
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log after response is finished (non-blocking)
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Only log in background, don't block the response
    setImmediate(() => {
      logger.info({
        type: 'request',
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      });
    });
  });
  
  next();
}

/**
 * Error handler middleware
 */
export default function logErrorService(err, req, res, next) {
  if (!err) {
    return new APIError(
      'Error with the server!',
      HTTPStatus.INTERNAL_SERVER_ERROR,
      true,
    );
  }

  // Log error asynchronously (non-blocking)
  setImmediate(() => {
    logger.logError(err, req);
  });

  const error = {
    message: err.message || 'Internal Server Error.',
  };

  // Add error details in non-production
  if (!isProd && err.stack) {
    error.stack = err.stack;
  }

  if (err.errors) {
    error.errors = {};
    const { errors } = err;
    try {
      if (Array.isArray(errors)) {
        error.errors = RequiredError.makePretty(errors);
      } else if (typeof errors === 'object' && errors !== null) {
        Object.keys(errors).forEach(key => {
          const errVal = errors[key];
          // Handle different error formats
          if (typeof errVal === 'string') {
            error.errors[key] = errVal;
          } else if (errVal && typeof errVal === 'object') {
            error.errors[key] = errVal.message || errVal.msg || String(errVal);
          } else {
            error.errors[key] = String(errVal);
          }
        });
      }
    } catch (parseErr) {
      console.error('Error parsing validation errors:', parseErr);
      error.errors = { general: 'Validation error occurred' };
    }
  }

  res.status(err.status || HTTPStatus.INTERNAL_SERVER_ERROR).json(error);

  return next();
}
