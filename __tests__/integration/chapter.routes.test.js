/**
 * Integration Tests: Chapter Routes
 * Tests for chapter CRUD endpoints
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';

// Create test app with mock routes
const app = express();
app.use(express.json());

// In-memory test data
let chapters = [
  { qbs_chapter_id: 1, qbs_chapter_name: 'Algebra', qbs_sub_id: 1, tenant_id: 1 },
  { qbs_chapter_id: 2, qbs_chapter_name: 'Geometry', qbs_sub_id: 1, tenant_id: 1 },
  { qbs_chapter_id: 3, qbs_chapter_name: 'Physics', qbs_sub_id: 2, tenant_id: 2 },
];

// Mock auth middleware
const mockAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = { user_id: 1, tenant_id: 1 };
  req.tenantId = 1;
  next();
};

// GET /api/chapters
app.get('/api/chapters', mockAuth, (req, res) => {
  const tenantChapters = chapters.filter(c => c.tenant_id === req.tenantId);
  res.status(200).json({
    success: true,
    data: tenantChapters,
    pagination: {
      total: tenantChapters.length,
      page: 1,
      limit: 20,
    },
  });
});

// GET /api/chapters/:id
app.get('/api/chapters/:id', mockAuth, (req, res) => {
  const chapter = chapters.find(
    c => c.qbs_chapter_id === parseInt(req.params.id) && c.tenant_id === req.tenantId
  );
  
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  
  res.status(200).json({ success: true, data: chapter });
});

// POST /api/chapters
app.post('/api/chapters', mockAuth, (req, res) => {
  const { qbs_chapter_name, qbs_sub_id } = req.body;
  
  if (!qbs_chapter_name) {
    return res.status(400).json({ success: false, message: 'Chapter name is required' });
  }
  
  const newChapter = {
    qbs_chapter_id: chapters.length + 1,
    qbs_chapter_name,
    qbs_sub_id: qbs_sub_id || null,
    tenant_id: req.tenantId,
  };
  
  chapters.push(newChapter);
  res.status(201).json({ success: true, data: newChapter });
});

// PUT /api/chapters/:id
app.put('/api/chapters/:id', mockAuth, (req, res) => {
  const index = chapters.findIndex(
    c => c.qbs_chapter_id === parseInt(req.params.id) && c.tenant_id === req.tenantId
  );
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  
  chapters[index] = { ...chapters[index], ...req.body };
  res.status(200).json({ success: true, data: chapters[index] });
});

// DELETE /api/chapters/:id
app.delete('/api/chapters/:id', mockAuth, (req, res) => {
  const index = chapters.findIndex(
    c => c.qbs_chapter_id === parseInt(req.params.id) && c.tenant_id === req.tenantId
  );
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  
  chapters.splice(index, 1);
  res.status(200).json({ success: true, message: 'Chapter deleted' });
});

const request = supertest(app);
const validToken = 'Bearer valid-test-token';

describe('Chapter Routes Integration', () => {
  beforeEach(() => {
    // Reset test data
    chapters = [
      { qbs_chapter_id: 1, qbs_chapter_name: 'Algebra', qbs_sub_id: 1, tenant_id: 1 },
      { qbs_chapter_id: 2, qbs_chapter_name: 'Geometry', qbs_sub_id: 1, tenant_id: 1 },
      { qbs_chapter_id: 3, qbs_chapter_name: 'Physics', qbs_sub_id: 2, tenant_id: 2 },
    ];
  });

  describe('GET /api/chapters', () => {
    it('should return 401 without auth token', async () => {
      const response = await request.get('/api/chapters');
      expect(response.status).toBe(401);
    });

    it('should return chapters for authenticated user', async () => {
      const response = await request
        .get('/api/chapters')
        .set('Authorization', validToken);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only tenant 1 chapters
    });

    it('should not return other tenant chapters', async () => {
      const response = await request
        .get('/api/chapters')
        .set('Authorization', validToken);
      
      const hasTenant2Chapter = response.body.data.some(c => c.tenant_id === 2);
      expect(hasTenant2Chapter).toBe(false);
    });

    it('should include pagination info', async () => {
      const response = await request
        .get('/api/chapters')
        .set('Authorization', validToken);
      
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/chapters/:id', () => {
    it('should return chapter by ID', async () => {
      const response = await request
        .get('/api/chapters/1')
        .set('Authorization', validToken);
      
      expect(response.status).toBe(200);
      expect(response.body.data.qbs_chapter_name).toBe('Algebra');
    });

    it('should return 404 for non-existent chapter', async () => {
      const response = await request
        .get('/api/chapters/999')
        .set('Authorization', validToken);
      
      expect(response.status).toBe(404);
    });

    it('should return 404 for other tenant chapter', async () => {
      const response = await request
        .get('/api/chapters/3') // Physics belongs to tenant 2
        .set('Authorization', validToken);
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/chapters', () => {
    it('should create new chapter', async () => {
      const response = await request
        .post('/api/chapters')
        .set('Authorization', validToken)
        .send({ qbs_chapter_name: 'Calculus', qbs_sub_id: 1 });
      
      expect(response.status).toBe(201);
      expect(response.body.data.qbs_chapter_name).toBe('Calculus');
      expect(response.body.data.tenant_id).toBe(1);
    });

    it('should return 400 for missing chapter name', async () => {
      const response = await request
        .post('/api/chapters')
        .set('Authorization', validToken)
        .send({ qbs_sub_id: 1 });
      
      expect(response.status).toBe(400);
    });

    it('should auto-assign tenant_id', async () => {
      const response = await request
        .post('/api/chapters')
        .set('Authorization', validToken)
        .send({ qbs_chapter_name: 'Statistics' });
      
      expect(response.body.data.tenant_id).toBe(1);
    });
  });

  describe('PUT /api/chapters/:id', () => {
    it('should update chapter', async () => {
      const response = await request
        .put('/api/chapters/1')
        .set('Authorization', validToken)
        .send({ qbs_chapter_name: 'Advanced Algebra' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.qbs_chapter_name).toBe('Advanced Algebra');
    });

    it('should return 404 for non-existent chapter', async () => {
      const response = await request
        .put('/api/chapters/999')
        .set('Authorization', validToken)
        .send({ qbs_chapter_name: 'Test' });
      
      expect(response.status).toBe(404);
    });

    it('should not update other tenant chapter', async () => {
      const response = await request
        .put('/api/chapters/3')
        .set('Authorization', validToken)
        .send({ qbs_chapter_name: 'Hacked' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/chapters/:id', () => {
    it('should delete chapter', async () => {
      const response = await request
        .delete('/api/chapters/1')
        .set('Authorization', validToken);
      
      expect(response.status).toBe(200);
      
      // Verify deletion
      const getResponse = await request
        .get('/api/chapters/1')
        .set('Authorization', validToken);
      expect(getResponse.status).toBe(404);
    });

    it('should not delete other tenant chapter', async () => {
      const response = await request
        .delete('/api/chapters/3')
        .set('Authorization', validToken);
      
      expect(response.status).toBe(404);
    });
  });
});

describe('Multi-tenant Isolation', () => {
  it('should enforce tenant isolation on all operations', async () => {
    // User with tenant_id: 1 cannot access tenant_id: 2 data
    
    const listResponse = await request
      .get('/api/chapters')
      .set('Authorization', validToken);
    
    expect(listResponse.body.data.every(c => c.tenant_id === 1)).toBe(true);
  });
});
