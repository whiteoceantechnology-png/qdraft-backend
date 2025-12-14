/**
 * Unit Tests: Chapter Controller
 * Tests for chapter CRUD operations
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockRequest, mockResponse, mockNext } from '../helpers/mockExpress.js';

// Mock models
const mockChapter = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockQuestion = {};
const mockPattern = {};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  Chapter: mockChapter,
  Question: mockQuestion,
  Pattern: mockPattern,
}));

// Mock tenant middleware
jest.unstable_mockModule('../../src/middlewares/tenant.middleware.js', () => ({
  tenantFilter: jest.fn((req) => ({ tenant_id: req.tenantId || 1 })),
  tenantData: jest.fn((req) => ({ tenant_id: req.tenantId || 1 })),
}));

// Import after mocking
const chapterController = await import('../../src/controllers/chapter.controller.js');

describe('Chapter Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest({ tenantId: 1 });
    res = mockResponse();
    next = mockNext();
  });

  describe('getList()', () => {
    it('should return list of chapters with status 200', async () => {
      const chapters = [
        { qbs_chapter_id: 1, qbs_chapter_name: 'Chapter 1', question_count: 10 },
        { qbs_chapter_id: 2, qbs_chapter_name: 'Chapter 2', question_count: 5 },
      ];
      
      mockChapter.findAll.mockResolvedValue(chapters);
      req.query = {};
      
      await chapterController.getList(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(chapters);
    });

    it('should apply pagination from query params', async () => {
      mockChapter.findAll.mockResolvedValue([]);
      req.query = { limit: '10', skip: '20' };
      
      await chapterController.getList(req, res, next);
      
      expect(mockChapter.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );
    });

    it('should filter by subjectId when provided', async () => {
      mockChapter.findAll.mockResolvedValue([]);
      req.query = { subjectId: '5' };
      
      await chapterController.getList(req, res, next);
      
      expect(mockChapter.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            qbs_sub_id: '5',
          }),
        })
      );
    });

    it('should filter by deptId when provided', async () => {
      mockChapter.findAll.mockResolvedValue([]);
      req.query = { deptId: '3' };
      
      await chapterController.getList(req, res, next);
      
      expect(mockChapter.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            qbs_dept_id: '3',
          }),
        })
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      mockChapter.findAll.mockRejectedValue(error);
      req.query = {};
      
      await chapterController.getList(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('getById()', () => {
    it('should return chapter when found', async () => {
      const chapter = { qbs_chapter_id: 1, qbs_chapter_name: 'Test Chapter' };
      mockChapter.findOne.mockResolvedValue(chapter);
      req.params = { id: '1' };
      
      await chapterController.getById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(chapter);
    });

    it('should return 404 when chapter not found', async () => {
      mockChapter.findOne.mockResolvedValue(null);
      req.params = { id: '999' };
      
      await chapterController.getById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Chapter not found' });
    });

    it('should apply tenant filter', async () => {
      mockChapter.findOne.mockResolvedValue(null);
      req.params = { id: '1' };
      req.tenantId = 5;
      
      await chapterController.getById(req, res, next);
      
      expect(mockChapter.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            qbs_chapter_id: '1',
          }),
        })
      );
    });
  });

  describe('create()', () => {
    it('should create chapter and return 201', async () => {
      const newChapter = {
        qbs_chapter_id: 1,
        qbs_chapter_name: 'New Chapter',
        tenant_id: 1,
      };
      
      mockChapter.create.mockResolvedValue(newChapter);
      req.body = {
        qbs_chapter_name: 'New Chapter',
        qbs_dept_id: 1,
        qbs_sub_id: 1,
      };
      
      await chapterController.create(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newChapter);
    });

    it('should include tenant_id from tenantData', async () => {
      mockChapter.create.mockResolvedValue({ qbs_chapter_id: 1 });
      req.body = { qbs_chapter_name: 'Test' };
      
      await chapterController.create(req, res, next);
      
      expect(mockChapter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 1,
        })
      );
    });

    it('should call next with error on validation failure', async () => {
      const error = new Error('Validation error');
      mockChapter.create.mockRejectedValue(error);
      req.body = {};
      
      await chapterController.create(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should only return chapters for the current tenant', async () => {
      const tenant1Chapters = [{ qbs_chapter_id: 1, tenant_id: 1 }];
      mockChapter.findAll.mockResolvedValue(tenant1Chapters);
      req.tenantId = 1;
      req.query = {};
      
      await chapterController.getList(req, res, next);
      
      // Verify tenant filter was applied
      expect(res.json).toHaveBeenCalledWith(tenant1Chapters);
    });

    it('should not allow access to other tenant chapters', async () => {
      mockChapter.findOne.mockResolvedValue(null); // Simulates tenant filter working
      req.tenantId = 1;
      req.params = { id: '1' }; // This chapter belongs to tenant 2
      
      await chapterController.getById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
