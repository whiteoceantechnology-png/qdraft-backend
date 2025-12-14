/**
 * Jest Test Setup
 * Global test configuration and utilities for QB-Server
 */
import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

// Global timeout
jest.setTimeout(30000);

// Mock console to reduce noise in tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified time
   * @param {number} ms - Milliseconds to wait
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate a random email
   */
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  
  /**
   * Generate a random string
   */
  randomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
};

// Cleanup after all tests
afterAll(async () => {
  // Allow pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
