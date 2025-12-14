/**
 * Unit Tests: Cache Service
 * Tests for the in-memory caching layer
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as cache from '../../src/services/cache.js';

describe('Cache Service', () => {
  beforeEach(() => {
    cache.flush();
  });

  afterEach(() => {
    cache.flush();
  });

  describe('set() and get()', () => {
    it('should store and retrieve a value', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should store and retrieve objects', () => {
      const obj = { id: 1, name: 'Test', nested: { value: true } };
      cache.set('object-key', obj);
      expect(cache.get('object-key')).toEqual(obj);
    });

    it('should store and retrieve arrays', () => {
      const arr = [1, 2, 3, { id: 1 }];
      cache.set('array-key', arr);
      expect(cache.get('array-key')).toEqual(arr);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cache.set('default-ttl', 'value');
      expect(cache.get('default-ttl')).toBe('value');
    });

    it('should respect custom TTL', () => {
      cache.set('short-ttl', 'value', 1); // 1 second TTL
      expect(cache.get('short-ttl')).toBe('value');
    });
  });

  describe('TTL expiration', () => {
    it('should expire values after TTL', async () => {
      cache.set('expiring-key', 'value', 1); // 1 second TTL
      expect(cache.get('expiring-key')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('expiring-key')).toBeNull();
    });
  });

  describe('del()', () => {
    it('should delete a specific key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.del('key1');
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should not throw when deleting non-existent key', () => {
      expect(() => cache.del('non-existent')).not.toThrow();
    });
  });

  describe('delPattern()', () => {
    it('should delete keys matching pattern with wildcard', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('tenant:1', 'tenant1');
      
      cache.delPattern('user:*');
      
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('tenant:1')).toBe('tenant1');
    });

    it('should handle complex patterns', () => {
      cache.set('tenant:1:user:1', 'value1');
      cache.set('tenant:1:user:2', 'value2');
      cache.set('tenant:2:user:1', 'value3');
      
      cache.delPattern('tenant:1:*');
      
      expect(cache.get('tenant:1:user:1')).toBeNull();
      expect(cache.get('tenant:1:user:2')).toBeNull();
      expect(cache.get('tenant:2:user:1')).toBe('value3');
    });
  });

  describe('flush()', () => {
    it('should clear all cached values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.flush();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should reset cache stats', () => {
      cache.set('key1', 'value1');
      cache.flush();
      
      const stats = cache.stats();
      expect(stats.size).toBe(0);
    });
  });

  describe('stats()', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.stats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBeDefined();
      expect(Array.isArray(stats.keys)).toBe(true);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });

  describe('keys generators', () => {
    it('should generate tenant cache key', () => {
      const key = cache.keys.tenant(123);
      expect(key).toBe('tenant:123');
    });

    it('should generate user cache key', () => {
      const key = cache.keys.user(456);
      expect(key).toBe('user:456');
    });

    it('should generate user by username cache key', () => {
      const key = cache.keys.userByUsername(1, 'testuser');
      expect(key).toBe('user:1:username:testuser');
    });

    it('should generate chapters cache key', () => {
      const key = cache.keys.chapters(1);
      expect(key).toBe('chapters:tenant:1');
    });
  });

  describe('TTL constants', () => {
    it('should export TTL constants', () => {
      expect(cache.TTL.SHORT).toBeDefined();
      expect(cache.TTL.MEDIUM).toBeDefined();
      expect(cache.TTL.LONG).toBeDefined();
      expect(cache.TTL.SHORT).toBeLessThan(cache.TTL.MEDIUM);
      expect(cache.TTL.MEDIUM).toBeLessThan(cache.TTL.LONG);
    });
  });
});
