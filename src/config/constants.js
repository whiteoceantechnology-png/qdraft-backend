// require('dotenv').config();
 import 'dotenv/config.js';

const WHITELIST = {};

const devConfig = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  DB_HOST: process.env.DB_HOST_DEV || 'localhost',
  DB_PORT: process.env.DB_PORT_DEV || 3306,
  DB_NAME: process.env.DB_NAME_DEV || 'qb_server_dev',
  DB_USER: process.env.DB_USER_DEV || 'root',
  DB_PASS: process.env.DB_PASS_DEV || '',
};

const testConfig = {
  JWT_SECRET: 'test-secret-key',
  DB_HOST: process.env.DB_HOST_TEST || 'localhost',
  DB_PORT: process.env.DB_PORT_TEST || 3306,
  DB_NAME: process.env.DB_NAME_TEST || 'qb_server_test',
  DB_USER: process.env.DB_USER_TEST || 'root',
  DB_PASS: process.env.DB_PASS_TEST || '',
};

const prodConfig = {
  JWT_SECRET: process.env.JWT_SECRET,
  DB_HOST: process.env.DB_HOST_PROD || 'localhost',
  DB_PORT: process.env.DB_PORT_PROD || 3306,
  DB_NAME: process.env.DB_NAME_PROD || 'qb_server',
  DB_USER: process.env.DB_USER_PROD || 'root',
  DB_PASS: process.env.DB_PASS_PROD || '',
};

const defaultConfig = {
  PORT: process.env.PORT || 3000,
  RAVEN_ID: process.env.RAVEN_ID,
  WHITELIST,
};

function envConfig(env) {
  switch (env) {
    case 'development':
      return devConfig;
    case 'test':
      return testConfig;
    default:
      return prodConfig;
  }
}

export default {
  ...defaultConfig,
  ...envConfig(process.env.NODE_ENV),
};
