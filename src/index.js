/* eslint-disable no-console */
/**
 * Server setup - Sequelize/MariaDB
 */
import express from 'express';
import chalk from 'chalk';

import { sequelize, connectWithRetry, closeConnection } from './config/database.js';
import middlewaresConfig from './config/middlewares.js';
import constants from './config/constants.js';
import ApiRoutes from './routes/index.js';

// Import models to ensure associations are set up
import './models/index.js';

const app = express();

// Wrap all the middlewares with the server
middlewaresConfig(app);

// Add the apiRoutes stack to the server
app.use('/api', ApiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler for unhandled routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectWithRetry();
    
    // Start server
    const server = app.listen(constants.PORT, err => {
      if (err) {
        console.log(chalk.red('Cannot run!'));
        process.exit(1);
      } else {
        console.log(
          chalk.green.bold(
            `
        Yep this is working í½º
        App listen on port: ${constants.PORT} í½•
        Env: ${process.env.NODE_ENV} í¶„
      `,
          ),
        );
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      console.log(chalk.yellow(`\n${signal} received. Starting graceful shutdown...`));
      
      server.close(async () => {
        console.log(chalk.yellow('HTTP server closed.'));
        
        try {
          await closeConnection();
          console.log(chalk.yellow('MariaDB connection closed.'));
          process.exit(0);
        } catch (err) {
          console.error('Error closing MariaDB connection:', err);
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

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(chalk.red('Uncaught Exception:'), err);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
      // Don't exit, just log - PM2 will handle restarts if needed
    });

  } catch (error) {
    console.error(chalk.red('Failed to start server:'), error);
    process.exit(1);
  }
};

startServer();

export default app;
