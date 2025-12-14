/**
 * Configuration of the server middlewares.
 * Optimized for SaaS performance
 */

import bodyParser from 'body-parser';
import compression from 'compression';
import passport from 'passport';
import methodOverride from 'method-override';
import helmet from 'helmet';
import cors from 'cors';
import expressStatusMonitor from 'express-status-monitor';
import { requestLogger } from '../services/log.js';
import { responseTime, apiRateLimit, requestTimeout } from '../middlewares/performance.middleware.js';

const enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';
const isProd = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  exposedHeaders: ['X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours - cache preflight requests
};

// Compression options - skip small responses
const compressionOptions = {
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
};

export default app => {
  // Response time tracking (first middleware)
  app.use(responseTime);
  
  // Request timeout (30s default, 60s for production)
  app.use(requestTimeout(isProd ? 60000 : 30000));
  
  // Compression for all responses
  app.use(compression(compressionOptions));
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: isProd,
    crossOriginEmbedderPolicy: false,
  }));
  
  // CORS
  app.use(cors(corsOptions));
  
  // Body parsing with limits
  app.use(bodyParser.json({ 
    limit: '5mb',
    strict: true,
  }));
  app.use(bodyParser.urlencoded({ 
    extended: true, 
    limit: '5mb',
    parameterLimit: 1000,
  }));
  
  // Passport initialization
  app.use(passport.initialize());
  
  // Rate limiting (apply to all API routes)
  app.use('/api', apiRateLimit);
  
  // Status monitor (dev only)
  if (!isProd) {
    app.use(expressStatusMonitor({
      title: 'QB Server Status',
      path: '/status',
      spans: [
        { interval: 1, retention: 60 },    // 1 second intervals, 60 data points
        { interval: 5, retention: 60 },    // 5 second intervals, 60 data points
        { interval: 15, retention: 60 },   // 15 second intervals, 60 data points
      ],
    }));
  }
  
  // Optional request logging
  if (enableRequestLogging) {
    app.use(requestLogger);
  }
  
  // Method override for legacy clients
  app.use(methodOverride());
  
  // Trust proxy for accurate IP addresses behind load balancer
  if (isProd) {
    app.set('trust proxy', 1);
  }
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
};
