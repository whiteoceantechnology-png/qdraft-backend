/**
 * Unit Tests: Dashboard Controller
 * Tests for dashboard statistics endpoints
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock Sequelize operators
jest.unstable_mockModule('sequelize', () => ({
  Op: {
    gte: Symbol('gte'),
    lte: Symbol('lte'),
    between: Symbol('between'),
  },
  fn: jest.fn((name, col) => ({ fn: name, col })),
  col: jest.fn((name) => ({ col: name })),
  literal: jest.fn((sql) => ({ literal: sql })),
}));

// Mock models
const mockExam = {
  count: jest.fn(),
  findAll: jest.fn(),
};

const mockQuestion = {
  count: jest.fn(),
  findAll: jest.fn(),
};

const mockBlueprint = {
  count: jest.fn(),
};

const mockChapter = {
  count: jest.fn(),
};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  Exam: mockExam,
  Question: mockQuestion,
  Blueprint: mockBlueprint,
  Chapter: mockChapter,
}));

// Mock tenant middleware
jest.unstable_mockModule('../../src/middlewares/tenant.middleware.js', () => ({
  tenantFilter: jest.fn((req) => ({ tenant_id: req.tenantId || 1 })),
}));

// Import after mocking
const dashboardController = await import('../../src/controllers/dashboard.controller.js');

describe('Dashboard Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest({ tenantId: 1, user: { user_id: 1, tenant_id: 1 } });
    res = mockResponse();
    next = mockNext();
  });

  describe('getDashboardStats()', () => {
    it('should return dashboard statistics with status 200', async () => {
      mockExam.count.mockResolvedValue(10);
      mockQuestion.count.mockResolvedValue(500);
      mockBlueprint.count.mockResolvedValue(5);
      mockChapter.count.mockResolvedValue(20);
      
      await dashboardController.getDashboardStats(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalExams: 10,
          totalQuestions: 500,
          totalBlueprints: 5,
          totalChapters: 20,
        })
      );
    });

    it('should apply tenant filter to all counts', async () => {
      mockExam.count.mockResolvedValue(0);
      mockQuestion.count.mockResolvedValue(0);
      mockBlueprint.count.mockResolvedValue(0);
      mockChapter.count.mockResolvedValue(0);
      req.tenantId = 5;
      
      await dashboardController.getDashboardStats(req, res, next);
      
      expect(mockExam.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: 5,
          }),
        })
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      mockExam.count.mockRejectedValue(error);
      
      await dashboardController.getDashboardStats(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return zero counts for empty tenant', async () => {
      mockExam.count.mockResolvedValue(0);
      mockQuestion.count.mockResolvedValue(0);
      mockBlueprint.count.mockResolvedValue(0);
      mockChapter.count.mockResolvedValue(0);
      
      await dashboardController.getDashboardStats(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        totalExams: 0,
        totalQuestions: 0,
        totalBlueprints: 0,
        totalChapters: 0,
      });
    });
  });

  describe('getDashboardMonthlyStats()', () => {
    it('should return monthly statistics', async () => {
      const monthlyData = [
        { month: '2024-01', count: 10 },
        { month: '2024-02', count: 15 },
      ];
      
      mockExam.findAll.mockResolvedValue(monthlyData);
      mockQuestion.findAll.mockResolvedValue(monthlyData);
      
      await dashboardController.getDashboardMonthlyStats(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by date range when provided', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      
      mockExam.findAll.mockResolvedValue([]);
      mockQuestion.findAll.mockResolvedValue([]);
      
      await dashboardController.getDashboardMonthlyStats(req, res, next);
      
      expect(mockExam.findAll).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Query failed');
      mockExam.findAll.mockRejectedValue(error);
      
      await dashboardController.getDashboardMonthlyStats(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should run counts in parallel for better performance', async () => {
      const startTime = Date.now();
      
      // Simulate slow queries
      mockExam.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(10), 50))
      );
      mockQuestion.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(100), 50))
      );
      mockBlueprint.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(5), 50))
      );
      mockChapter.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(20), 50))
      );
      
      await dashboardController.getDashboardStats(req, res, next);
      
      const duration = Date.now() - startTime;
      
      // If running in parallel, should take ~50ms, not 200ms
      // Allow some buffer for test execution overhead
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should only count resources for current tenant', async () => {
      req.tenantId = 1;
      
      mockExam.count.mockResolvedValue(10);
      mockQuestion.count.mockResolvedValue(100);
      mockBlueprint.count.mockResolvedValue(5);
      mockChapter.count.mockResolvedValue(20);
      
      await dashboardController.getDashboardStats(req, res, next);
      
      // Verify all queries include tenant filter
      expect(mockExam.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: 1 }),
        })
      );
      expect(mockQuestion.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: 1 }),
        })
      );
    });
  });
});
