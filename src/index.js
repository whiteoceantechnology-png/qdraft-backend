/* eslint-disable no-console */
/**
 * QB Server - Multi-tenant SaaS API
 * Optimized for performance with sub-500ms response times
 */
import express from 'express';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

import { sequelize, connectDB } from './config/database.js';
import middlewaresConfig from './config/middlewares.js';
import constants from './config/constants.js';
import ApiRoutes from './routes/index.js';
import cache from './services/cache.js';
import { openApiSpec, generateDocsHtml } from './routes/docs.routes.js';

// Import models to register associations
import './models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const startTime = Date.now();

// Wrap all the middlewares with the server
middlewaresConfig(app);

// Serve static files for admin panel
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// API Documentation endpoints
app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateDocsHtml());
});

app.get('/api-docs/spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

// Redirect /docs to /api-docs
app.get('/docs', (req, res) => res.redirect('/api-docs'));

// Add the apiRoutes stack to the server
app.use('/api', ApiRoutes);

// Health check endpoint (lightweight)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check (includes DB check)
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    cache: cache.stats(),
    database: 'checking...',
  };

  try {
    const start = Date.now();
    await sequelize.authenticate();
    health.database = {
      status: 'connected',
      responseTime: Date.now() - start,
    };
    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.database = {
      status: 'disconnected',
      error: error.message,
    };
    res.status(503).json(health);
  }
});

// Readiness probe (for Kubernetes/container orchestration)
app.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('NOT READY');
  }
});

// Metrics endpoint (simple, can be extended for Prometheus)
app.get('/metrics', (req, res) => {
  const metrics = {
    uptime_seconds: process.uptime(),
    memory_heap_used_bytes: process.memoryUsage().heapUsed,
    memory_heap_total_bytes: process.memoryUsage().heapTotal,
    memory_rss_bytes: process.memoryUsage().rss,
    cache_size: cache.stats().size,
    node_version: process.version,
    env: process.env.NODE_ENV,
  };
  res.json(metrics);
});

// Cache management endpoints (admin only, should be protected in production)
if (process.env.NODE_ENV === 'development') {
  app.get('/cache/stats', (req, res) => res.json(cache.stats()));
  app.post('/cache/flush', (req, res) => {
    cache.flush();
    res.json({ message: 'Cache flushed' });
  });
}

// Global error handler for unhandled routes
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Log error
  console.error(chalk.red(`[ERROR] ${req.method} ${req.path}:`), err.message);
  if (isDev) console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
    ...(isDev && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(constants.PORT, err => {
      if (err) {
        console.log(chalk.red('Cannot run!'));
        process.exit(1);
      } else {
        const bootTime = Date.now() - startTime;
        console.log(
          chalk.green.bold(`
╔══════════════════════════════════════════════════════════╗
║  QB Server Started Successfully! 🚀                     ║
╠══════════════════════════════════════════════════════════╣
║  Port:      ${String(constants.PORT).padEnd(44)}║
║  Env:       ${String(process.env.NODE_ENV || 'development').padEnd(44)}║
║  Boot Time: ${String(bootTime + 'ms').padEnd(44)}║
║  Database:  MariaDB (Multi-tenant)                       ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                              ║
║    API:     http://localhost:${constants.PORT}/api${' '.repeat(27)}║
║    Docs:    http://localhost:${constants.PORT}/api-docs${' '.repeat(23)}║
║    Health:  http://localhost:${constants.PORT}/health${' '.repeat(24)}║
╚══════════════════════════════════════════════════════════╝
          `),
        );
      }
    });

    // Set server timeout
    server.timeout = 60000; // 60 seconds
    server.keepAliveTimeout = 65000; // Slightly higher than timeout

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(chalk.yellow(`\n${signal} received. Starting graceful shutdown...`));
      
      server.close(async () => {
        console.log(chalk.yellow('HTTP server closed.'));
        
        try {
          // Flush cache
          cache.flush();
          console.log(chalk.yellow('Cache flushed.'));
          
          // Close database
          await sequelize.close();
          console.log(chalk.yellow('MariaDB connection closed.'));
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error(chalk.red('Could not close connections in time, forcefully shutting down'));
        process.exit(1);
      }, 30000);
    };

    // Handle process signals for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error(chalk.red('Failed to start server:'), error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught Exception:'), err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;
