/* eslint-disable no-console */
/**
 * Server setup - Multi-tenant with Sequelize/MariaDB
 */
import express from 'express';
import chalk from 'chalk';

import { sequelize, connectDB } from './config/database.js';
import middlewaresConfig from './config/middlewares.js';
import constants from './config/constants.js';
import ApiRoutes from './routes/index.js';

// Import models to register associations
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
      error: error.message,
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
        console.log(
          chalk.green.bold(
            `
        Yep this is working 🍺
        App listen on port: ${constants.PORT} 🍕
        Env: ${process.env.NODE_ENV} 🦄
        Database: MariaDB (Multi-tenant)
      `,
          ),
        );
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(chalk.yellow(`\n${signal} received. Starting graceful shutdown...`));
      
      server.close(async () => {
        console.log(chalk.yellow('HTTP server closed.'));
        
        try {
          await sequelize.close();
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
