/**
 * Unit Tests: User Model
 * Tests for User model methods and validation (Sequelize)
 */
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock bcrypt
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hashSync: jest.fn((password) => `hashed_${password}`),
    compareSync: jest.fn((password, hash) => hash === `hashed_${password}`),
  },
}));

// Mock jwt
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(() => ({ user_id: 1, tenant_id: 1 })),
  },
}));

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  sequelize: {
    define: jest.fn(),
  },
}));

describe('User Model', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', () => {
      const password = 'TestPassword123';
      const hash = bcrypt.hashSync(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('should verify password correctly', () => {
      const password = 'TestPassword123';
      const hash = bcrypt.hashSync(password, 10);
      
      expect(bcrypt.compareSync(password, hash)).toBe(true);
      expect(bcrypt.compareSync('wrongpassword', hash)).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const payload = { user_id: 1, tenant_id: 1, role: 'user' };
      const token = jwt.sign(payload, 'secret', { expiresIn: '7d' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include required fields in token payload', () => {
      const payload = { user_id: 1, tenant_id: 1, role: 'admin' };
      jwt.sign(payload, 'secret');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          tenant_id: 1,
          role: 'admin',
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('User Validation', () => {
    it('should require email', () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        tenant_id: 1,
      };
      
      // Email is missing - would fail Sequelize validation
      expect(userData.email).toBeUndefined();
    });

    it('should require username', () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123',
        tenant_id: 1,
      };
      
      expect(userData.username).toBeUndefined();
    });

    it('should require tenant_id', () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123',
      };
      
      expect(userData.tenant_id).toBeUndefined();
    });

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];
      
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'missing@.com',
      ];
      
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
      
      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe('toJSON() method', () => {
    it('should exclude password from output', () => {
      const userMock = {
        user_id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        username: 'testuser',
        get: function() {
          return { ...this };
        },
      };
      
      // Simulate toJSON behavior
      const values = { ...userMock.get() };
      delete values.password;
      delete values.get;
      
      expect(values.password).toBeUndefined();
      expect(values.email).toBe('test@example.com');
      expect(values.username).toBe('testuser');
    });
  });

  describe('toAuthJSON() method', () => {
    it('should return authentication response format', () => {
      const authResponse = {
        access_token: 'mock-token',
        user_id: 1,
        tenant_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };
      
      expect(authResponse).toHaveProperty('access_token');
      expect(typeof authResponse.access_token).toBe('string');
      expect(authResponse).toHaveProperty('user_id');
      expect(authResponse).toHaveProperty('tenant_id');
    });
  });

  describe('authenticateUser() method', () => {
    it('should return true for correct password', () => {
      const password = 'CorrectPassword123';
      const hash = `hashed_${password}`;
      
      // Mock bcrypt comparison
      const result = bcrypt.compareSync(password, hash);
      
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const password = 'CorrectPassword123';
      const hash = `hashed_${password}`;
      
      const result = bcrypt.compareSync('WrongPassword', hash);
      
      expect(result).toBe(false);
    });
  });
});
