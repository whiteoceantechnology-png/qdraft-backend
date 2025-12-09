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

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, errors, json, colorize } = format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Custom log format for files (JSON for easy parsing)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

const isDev = process.env.NODE_ENV === 'development';

// Create logger instance
const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'qb-server' },
  transports: [
    // Error logs - separate file for easy monitoring
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
      // Async options for non-blocking writes
      options: { flags: 'a' }
    }),
    // Combined logs - all levels
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
      options: { flags: 'a' }
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

// Add console transport in development
if (isDev) {
  logger.add(new transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Create a stream object for Morgan HTTP logging (if needed later)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods for structured logging
logger.logRequest = (req, responseTime) => {
  logger.info({
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
  
  logger.error(errorLog);
};

export default logger;
