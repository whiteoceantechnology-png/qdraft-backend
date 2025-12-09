/* eslint-disable no-console */

/**
 * Configuration for the database
 */

import mongoose from 'mongoose';
import chalk from 'chalk';

import constants from './constants.js';

// Remove the warning with Promise
mongoose.Promise = global.Promise;

// If debug run the mongoose debug options
mongoose.set('debug', process.env.MONGOOSE_DEBUG === 'true');

// Connection options
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4
};

// Retry connection logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let retryCount = 0;

async function connectWithRetry() {
  try {
    await mongoose.connect(constants.MONGO_URL, connectionOptions);
  } catch (err) {
    console.error(chalk.red(`MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`), err.message);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(chalk.yellow(`Retrying in ${RETRY_DELAY / 1000} seconds...`));
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.error(chalk.red('Max retries reached. Could not connect to MongoDB.'));
      // Don't exit - let PM2 handle the restart
    }
  }
}

// Initial connection
connectWithRetry();

// Connection event handlers
mongoose.connection
  .on('connected', () => {
    console.log(chalk.green('MongoDB Connected'));
    retryCount = 0; // Reset retry count on successful connection
  })
  .on('error', (err) => {
    console.error(chalk.red('MongoDB Error:'), err.message);
  })
  .on('disconnected', () => {
    console.log(chalk.yellow('MongoDB Disconnected'));
    // Attempt to reconnect if not shutting down
    if (mongoose.connection.readyState !== 0) {
      connectWithRetry();
    }
  })
  .on('reconnected', () => {
    console.log(chalk.green('MongoDB Reconnected'));
  });

export default mongoose.connection;
