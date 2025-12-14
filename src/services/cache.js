/**
 * Cache Service
 * In-memory cache with Redis-like interface for SaaS performance
 * Can be swapped with Redis in production
 */

// In-memory cache store
const cache = new Map();
const cacheExpiry = new Map();

// Cache configuration
const DEFAULT_TTL = 300; // 5 minutes in seconds
const MAX_CACHE_SIZE = 10000; // Maximum cache entries

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any} - Cached value or null
 */
export function get(key) {
  const expiry = cacheExpiry.get(key);
  
  if (expiry && Date.now() > expiry) {
    // Expired - remove and return null
    cache.delete(key);
    cacheExpiry.delete(key);
    return null;
  }
  
  return cache.get(key) || null;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  // Enforce max cache size (LRU-like eviction)
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
    cacheExpiry.delete(firstKey);
  }
  
  cache.set(key, value);
  cacheExpiry.set(key, Date.now() + (ttl * 1000));
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 */
export function del(key) {
  cache.delete(key);
  cacheExpiry.delete(key);
}

/**
 * Delete all keys matching pattern
 * @param {string} pattern - Pattern to match (supports * wildcard)
 */
export function delPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cacheExpiry.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function flush() {
  cache.clear();
  cacheExpiry.clear();
}

/**
 * Get cache stats
 */
export function stats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Cache key generators for different entities
 */
export const keys = {
  tenant: (id) => `tenant:${id}`,
  user: (id) => `user:${id}`,
  userByUsername: (tenantId, username) => `user:${tenantId}:username:${username}`,
  chapters: (tenantId, subId, deptId) => `chapters:${tenantId}:${subId || 'all'}:${deptId || 'all'}`,
  questionTypes: (tenantId) => `qtypes:${tenantId}`,
  dashboardStats: (tenantId, userId) => `dashboard:${tenantId}:${userId}`,
  examList: (tenantId, userId) => `exams:${tenantId}:${userId}`,
  blueprints: (tenantId, userId) => `blueprints:${tenantId}:${userId}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const TTL = {
  SHORT: 60,        // 1 minute - frequently changing data
  MEDIUM: 300,      // 5 minutes - moderately stable data
  LONG: 900,        // 15 minutes - stable reference data
  VERY_LONG: 3600,  // 1 hour - rarely changing config
};

export default {
  get,
  set,
  del,
  delPattern,
  flush,
  stats,
  keys,
  TTL,
};
