/**
 * Winston Logger Configuration
 * - Async file logging with buffering (non-blocking)
 * - Log rotation to manage file sizes
 * - Separate error and combined logs
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');

const isDev = process.env.NODE_ENV === 'development';

// Create logger instance (Winston v2 API)
const logger = new winston.Logger({
  level: isDev ? 'debug' : 'info',
  transports: [
    // Error logs - separate file for easy monitoring
    new winston.transports.File({
      name: 'error-file',
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      json: true,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined logs - all levels
    new winston.transports.File({
      name: 'combined-file',
      filename: path.join(logsDir, 'combined.log'),
      json: true,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exitOnError: false
});

// Add console transport in development
if (isDev) {
  logger.add(winston.transports.Console, {
    colorize: true,
    timestamp: true,
    prettyPrint: true
  });
}

// Create a stream object for Morgan HTTP logging (if needed later)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods for structured logging
logger.logRequest = (req, responseTime) => {
  logger.info('request', {
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    responseTime: `${responseTime}ms`
  });
};

logger.logError = (err, req = null) => {
  const errorLog = {
    type: 'error',
    message: err.message,
    stack: err.stack,
    code: err.code || err.status
  };
  
  if (req) {
    errorLog.method = req.method;
    errorLog.url = req.originalUrl;
    errorLog.ip = req.ip;
  }
  
  logger.error('error', errorLog);
};

export default logger;
