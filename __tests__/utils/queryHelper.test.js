/**
 * Unit Tests: Query Helper Utilities
 * Tests for pagination, filtering, and API response helpers
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  parsePagination,
  buildWhereClause,
  paginatedResponse,
  ApiResponse,
} from '../../src/utils/queryHelper.js';

describe('Query Helper Utilities', () => {
  describe('parsePagination()', () => {
    it('should return default pagination when no query provided', () => {
      const result = parsePagination({});
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
      });
    });

    it('should parse valid page and limit', () => {
      const result = parsePagination({ page: '3', limit: '50' });
      
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(100); // (3-1) * 50
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePagination({ page: '-5' });
      
      expect(result.page).toBe(1);
    });

    it('should enforce minimum limit of 1', () => {
      const result = parsePagination({ limit: '0' });
      
      expect(result.limit).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const result = parsePagination({ limit: '500' });
      
      expect(result.limit).toBe(100);
    });

    it('should handle non-numeric values gracefully', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' });
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should calculate correct offset', () => {
      expect(parsePagination({ page: '1', limit: '10' }).offset).toBe(0);
      expect(parsePagination({ page: '2', limit: '10' }).offset).toBe(10);
      expect(parsePagination({ page: '5', limit: '25' }).offset).toBe(100);
    });
  });

  describe('buildWhereClause()', () => {
    it('should return empty object when no filters provided', () => {
      const result = buildWhereClause({}, []);
      expect(result).toEqual({});
    });

    it('should build where clause for allowed fields', () => {
      const query = { name: 'Test', status: 'active', extra: 'ignored' };
      const allowedFields = ['name', 'status'];
      
      const result = buildWhereClause(query, allowedFields);
      
      expect(result).toEqual({ name: 'Test', status: 'active' });
      expect(result.extra).toBeUndefined();
    });

    it('should ignore undefined values', () => {
      const query = { name: 'Test', status: undefined };
      const allowedFields = ['name', 'status'];
      
      const result = buildWhereClause(query, allowedFields);
      
      expect(result).toEqual({ name: 'Test' });
    });

    it('should ignore empty string values', () => {
      const query = { name: 'Test', status: '' };
      const allowedFields = ['name', 'status'];
      
      const result = buildWhereClause(query, allowedFields);
      
      expect(result).toEqual({ name: 'Test' });
    });

    it('should preserve boolean false values', () => {
      const query = { name: 'Test', is_active: false };
      const allowedFields = ['name', 'is_active'];
      
      const result = buildWhereClause(query, allowedFields);
      
      expect(result).toEqual({ name: 'Test', is_active: false });
    });

    it('should preserve zero numeric values', () => {
      const query = { count: 0 };
      const allowedFields = ['count'];
      
      const result = buildWhereClause(query, allowedFields);
      
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('paginatedResponse()', () => {
    it('should format paginated response correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = paginatedResponse(data, 100, 1, 20);
      
      expect(result).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should calculate hasNext correctly', () => {
      const result = paginatedResponse([], 50, 3, 20);
      expect(result.pagination.hasNext).toBe(false); // page 3 of 3
      
      const result2 = paginatedResponse([], 50, 2, 20);
      expect(result2.pagination.hasNext).toBe(true); // page 2 of 3
    });

    it('should calculate hasPrev correctly', () => {
      const result = paginatedResponse([], 50, 1, 20);
      expect(result.pagination.hasPrev).toBe(false);
      
      const result2 = paginatedResponse([], 50, 2, 20);
      expect(result2.pagination.hasPrev).toBe(true);
    });

    it('should calculate totalPages correctly', () => {
      expect(paginatedResponse([], 100, 1, 20).pagination.totalPages).toBe(5);
      expect(paginatedResponse([], 101, 1, 20).pagination.totalPages).toBe(6);
      expect(paginatedResponse([], 0, 1, 20).pagination.totalPages).toBe(0);
      expect(paginatedResponse([], 1, 1, 20).pagination.totalPages).toBe(1);
    });

    it('should handle empty results', () => {
      const result = paginatedResponse([], 0, 1, 20);
      
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('ApiResponse', () => {
    describe('success()', () => {
      it('should create success response with data', () => {
        const result = ApiResponse.success({ id: 1, name: 'Test' });
        
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: 'Test' },
        });
      });

      it('should include optional message', () => {
        const result = ApiResponse.success({ id: 1 }, 'Created successfully');
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Created successfully');
      });
    });

    describe('error()', () => {
      it('should create error response', () => {
        const result = ApiResponse.error('Something went wrong');
        
        expect(result).toEqual({
          success: false,
          message: 'Something went wrong',
        });
      });

      it('should include error code when provided', () => {
        const result = ApiResponse.error('Not found', 'NOT_FOUND');
        
        expect(result.success).toBe(false);
        expect(result.message).toBe('Not found');
        expect(result.code).toBe('NOT_FOUND');
      });
    });

    describe('paginated()', () => {
      it('should create paginated success response', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const result = ApiResponse.paginated(data, 50, 1, 20);
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual(data);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.total).toBe(50);
      });
    });
  });
});
