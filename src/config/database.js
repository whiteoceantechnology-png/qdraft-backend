/* eslint-disable no-console */

/**
 * Database Configuration using Sequelize
 * Supports SQLite (dev), MariaDB (prod)
 * Multi-tenant support with optimized connection pooling
 */

import { Sequelize } from 'sequelize';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Check if SQLite mode is enabled for development
const useSQLite =  false//process.env.DB_USE_SQLITE === 'true' || (!isProd && !process.env.DB_HOST_DEV);

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
console.log(config)
// SQLite configuration for development
const sqlitePath = path.join(__dirname, '../../data/qb_server.sqlite');

if (useSQLite) {
  console.log(chalk.blue(`Using SQLite for local development`));
  console.log(chalk.blue(`Database file: ${sqlitePath}`));
} else {
  console.log(chalk.blue(`Using MariaDB configuration for environment: ${env}`));
  console.log(chalk.blue(`Database Host: ${config.host}, Database Name: ${config.database}`));
}
// Optimized pool settings for SaaS workloads
const poolConfig = {
  development: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  test: {
    max: 5,
    min: 1,
    acquire: 30000,
    idle: 10000,
  },
  production: {
    max: 50,           // Higher for production load
    min: 10,           // Keep connections warm
    acquire: 30000,    // 30s to acquire connection
    idle: 10000,       // Close idle connections after 10s
    evict: 1000,       // Check for idle connections every 1s
  },
};

// Create Sequelize instance - SQLite for local dev, MariaDB for production
let sequelize;

if (useSQLite) {
  // SQLite configuration for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    
    // Logging: only in dev
    logging: isDev ? (msg) => {
      console.log(chalk.gray('[SQL]'), msg);
    } : false,
    
    // SQLite-specific settings
    define: {
      timestamps: true,
      underscored: false,
    },
    
    // SQLite pool (single connection is recommended)
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // MariaDB configuration for production/remote development
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'mariadb',
    
    // Logging: only in dev, with timing
    logging: isDev ? (msg, timing) => {
      if (timing > 100) {
        console.log(chalk.yellow('[SQL SLOW]'), msg, `(${timing}ms)`);
      }
    } : false,
    
    // Benchmark queries to log timing
    benchmark: isDev,
    
    // Optimized connection pool
    pool: poolConfig[env] || poolConfig.production,
    
    // Charset settings
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
    },
    
    // Dialect-specific options for MariaDB
    dialectOptions: {
      connectTimeout: 10000,
      // Enable compression for production
      ...(isProd && { compress: true }),
      // Use native date/time
      dateStrings: true,
      typeCast: true,
    },
  });
}

export { sequelize };

// Query performance hints
export const queryHints = {
  // Use for read-only queries to improve performance
  readOnly: { 
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  },
  // Use for count queries
  count: {
    type: Sequelize.QueryTypes.SELECT,
    plain: true,
  },
};

// Retry connection logic
const MAX_RETRIES = useSQLite ? 1 : 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

export async function connectWithRetry() {
  const dbType = useSQLite ? 'SQLite' : 'MariaDB';
  
  try {
    await sequelize.authenticate();
    console.log(chalk.green(`${dbType} Connected`));
    retryCount = 0;

    // Sync models in development/test (creates tables)
    // NOTE: Using alter:false to prevent duplicate index creation
    // Use migrations for schema changes instead
    if (isDev || isTest || useSQLite) {
      try {
        await sequelize.sync({ alter: false, force: false });
        console.log(chalk.green('Database synchronized'));
      } catch (syncErr) {
        // Ignore "too many keys" error - database schema already exists
        if (syncErr.original?.code === 'ER_TOO_MANY_KEYS') {
          console.log(chalk.yellow('Warning: Skipping sync due to index limit. Clean up duplicate indexes in the database.'));
        } else {
          throw syncErr;
        }
      }
    }
  } catch (err) {
    console.log(err);
    console.error(chalk.red(`${dbType} connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`), err.message);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(chalk.yellow(`Retrying in ${RETRY_DELAY / 1000} seconds...`));
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.error(chalk.red(`Max retries reached. Could not connect to ${dbType}.`));
      if (!useSQLite) {
        console.log(chalk.yellow('Tip: Set DB_USE_SQLITE=true in .env to use SQLite for local development'));
      }
    }
  }
}

export async function closeConnection() {
  const dbType = useSQLite ? 'SQLite' : 'MariaDB';
  try {
    await sequelize.close();
    console.log(chalk.yellow(`${dbType} connection closed`));
  } catch (err) {
    console.error(chalk.red(`Error closing ${dbType} connection:`), err.message);
  }
}

// Alias for connectWithRetry
export const connectDB = connectWithRetry;

// Export useSQLite flag for other modules
export { useSQLite };

export default sequelize;
