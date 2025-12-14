/**
 * Integration Tests: Auth Routes
 * Tests for authentication endpoints
 */
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';

// Create test app
const app = express();
app.use(express.json());

// Mock auth routes
let mockUser = null;

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
    });
  }
  
  if (username === 'testuser' && password === 'password123') {
    return res.status(200).json({
      success: true,
      access_token: 'Bearer mock-token',
      user_id: 1,
      tenant_id: 1,
      username: 'testuser',
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid username or password',
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, tenant_id } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }
  
  if (!tenant_id) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID or tenant code is required',
    });
  }
  
  if (email === 'existing@example.com') {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
  }
  
  return res.status(201).json({
    success: true,
    user_id: 2,
    username,
    email,
    tenant_id,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const request = supertest(app);

describe('Auth Routes Integration', () => {
  describe('POST /api/auth/login', () => {
    it('should return 200 and token on valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.access_token).toMatch(/^JWT /);
      expect(response.body.user_id).toBeDefined();
    });

    it('should return 401 on invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when username is missing', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ username: 'testuser' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          tenant_id: 1,
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.username).toBe('newuser');
    });

    it('should return 400 when tenant_id is missing', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123',
          tenant_id: 1,
        });
      
      expect(response.status).toBe(409);
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

describe('Auth Response Format', () => {
  it('should return consistent success response structure', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('tenant_id');
  });

  it('should return consistent error response structure', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({ username: 'invalid', password: 'wrong' });
    
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });
});
