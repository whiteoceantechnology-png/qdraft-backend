/**
 * Unit Tests: filteredBody Utility
 * Tests for request body whitelist filtering
 */
import { describe, it, expect } from '@jest/globals';
import { filteredBody } from '../../src/utils/filteredBody.js';

describe('filteredBody Utility', () => {
  describe('Basic Filtering', () => {
    it('should filter body to only include whitelisted fields', () => {
      const body = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        role: 'admin', // Should be filtered out
      };
      const whitelist = ['name', 'email', 'password'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      });
      expect(result.role).toBeUndefined();
    });

    it('should filter the object given with the list provided', () => {
      const body = {
        title: 'Hello World',
        text: 'Hello World',
        image: 'url',
        logo: 'hello',
      };
      const whitelist = ['title', 'text'];
      expect(filteredBody(body, whitelist).title).toEqual('Hello World');
      expect(filteredBody(body, whitelist).text).toEqual('Hello World');
      expect(filteredBody(body, whitelist).image).toEqual(undefined);
      expect(filteredBody(body, whitelist).logo).toEqual(undefined);
    });

    it('should return empty object when no matches', () => {
      const body = { malicious: 'data', hacker: 'attempt' };
      const whitelist = ['name', 'email'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result).toEqual({});
    });

    it('should handle empty body', () => {
      const body = {};
      const whitelist = ['name', 'email'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result).toEqual({});
    });

    it('should handle empty whitelist', () => {
      const body = { name: 'John', email: 'john@example.com' };
      const whitelist = [];
      
      const result = filteredBody(body, whitelist);
      
      expect(result).toEqual({});
    });
  });

  describe('Value Preservation', () => {
    it('should preserve null values', () => {
      const body = { name: null, email: 'test@test.com' };
      const whitelist = ['name', 'email'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.name).toBeNull();
    });

    it('should preserve boolean values', () => {
      const body = { is_active: false, is_verified: true };
      const whitelist = ['is_active', 'is_verified'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.is_active).toBe(false);
      expect(result.is_verified).toBe(true);
    });

    it('should preserve numeric values including zero', () => {
      const body = { count: 0, price: 99.99 };
      const whitelist = ['count', 'price'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.count).toBe(0);
      expect(result.price).toBe(99.99);
    });

    it('should preserve array values', () => {
      const body = { tags: ['a', 'b', 'c'], name: 'test' };
      const whitelist = ['tags'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.tags).toEqual(['a', 'b', 'c']);
    });

    it('should preserve nested object values', () => {
      const body = {
        settings: { theme: 'dark', notifications: true },
        name: 'test',
      };
      const whitelist = ['settings'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.settings).toEqual({ theme: 'dark', notifications: true });
    });
  });

  describe('Security Use Cases', () => {
    it('should prevent role escalation attacks', () => {
      const body = {
        username: 'newuser',
        email: 'user@example.com',
        password: 'password123',
        role: 'admin', // Attacker trying to set admin role
        tenant_id: 999, // Attacker trying to access another tenant
      };
      const whitelist = ['username', 'email', 'password'];
      
      const result = filteredBody(body, whitelist);
      
      expect(result.role).toBeUndefined();
      expect(result.tenant_id).toBeUndefined();
    });

    it('should prevent mass assignment attacks', () => {
      const body = {
        title: 'My Post',
        content: 'Hello world',
        user_id: 999, // Trying to assign to different user
        is_published: true, // Trying to auto-publish
        view_count: 1000000, // Trying to inflate metrics
      };
      const whitelist = ['title', 'content'];
      
      const result = filteredBody(body, whitelist);
      
      expect(Object.keys(result)).toEqual(['title', 'content']);
    });
  });
});
