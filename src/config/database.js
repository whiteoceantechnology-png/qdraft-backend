/* eslint-disable no-console */

/**
 * MariaDB Database Configuration using Sequelize
 */

import { Sequelize } from 'sequelize';
import chalk from 'chalk';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Database configuration based on environment
const dbConfig = {
  development: {
    host: process.env.DB_HOST_DEV || 'localhost',
    port: process.env.DB_PORT_DEV || 3306,
    database: process.env.DB_NAME_DEV || 'qb_server_dev',
    username: process.env.DB_USER_DEV || 'root',
    password: process.env.DB_PASS_DEV || '',
  },
  test: {
    host: process.env.DB_HOST_TEST || 'localhost',
    port: process.env.DB_PORT_TEST || 3306,
    database: process.env.DB_NAME_TEST || 'qb_server_test',
    username: process.env.DB_USER_TEST || 'root',
    password: process.env.DB_PASS_TEST || '',
  },
  production: {
    host: process.env.DB_HOST_PROD || 'localhost',
    port: process.env.DB_PORT_PROD || 3306,
    database: process.env.DB_NAME_PROD || 'qb_server',
    username: process.env.DB_USER_PROD || 'root',
    password: process.env.DB_PASS_PROD || '',
  },
};

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Create Sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'mariadb',
  logging: isDev ? (msg) => console.log(chalk.cyan('[SQL]'), msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: {
    connectTimeout: 10000,
  },
});

// Retry connection logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

async function connectWithRetry() {
  try {
    await sequelize.authenticate();
    console.log(chalk.green('MariaDB Connected'));
    retryCount = 0;
    
    // Sync models in development (creates tables if they don't exist)
    if (isDev || isTest) {
      await sequelize.sync({ alter: true });
      console.log(chalk.green('Database synchronized'));
    }
  } catch (err) {
    console.error(chalk.red(`MariaDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`), err.message);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(chalk.yellow(`Retrying in ${RETRY_DELAY / 1000} seconds...`));
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.error(chalk.red('Max retries reached. Could not connect to MariaDB.'));
    }
  }
}

// Initial connection
connectWithRetry();

// Graceful shutdown
async function closeConnection() {
  try {
    await sequelize.close();
    console.log(chalk.yellow('MariaDB connection closed'));
  } catch (err) {
    console.error(chalk.red('Error closing MariaDB connection:'), err.message);
  }
}

export { sequelize, connectWithRetry, closeConnection };
export default sequelize;
