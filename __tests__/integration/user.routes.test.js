/**
 * Integration Tests: User Routes with Role-Based Authorization
 * Tests for user management endpoints with different role permissions
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (role, tenant_id = 1) => (req, res, next) => {
  req.user = {
    user_id: role === 'super_admin' ? 1 : 2,
    role,
    tenant_id,
    username: `${role}_user`,
  };
  next();
};

// Mock user data store
let users = [
  { user_id: 1, username: 'admin', role: 'super_admin', tenant_id: 1, email: 'admin@platform.com' },
  { user_id: 2, username: 'tadmin1', role: 'tenant_admin', tenant_id: 1, email: 'tadmin@tenant1.com' },
  { user_id: 3, username: 'teacher1', role: 'teacher', tenant_id: 1, email: 'teacher@tenant1.com' },
  { user_id: 4, username: 'user1', role: 'user', tenant_id: 1, email: 'user@tenant1.com' },
  { user_id: 5, username: 'tadmin2', role: 'tenant_admin', tenant_id: 2, email: 'tadmin@tenant2.com' },
];

// User routes
app.get('/api/users', mockAuth('tenant_admin'), (req, res) => {
  const { tenant_id, role } = req.user;
  
  // Super admin sees all users
  if (role === 'super_admin') {
    return res.status(200).json({
      success: true,
      data: users,
      pagination: { total: users.length, page: 1, limit: 10 },
    });
  }
  
  // Tenant admin sees only their tenant users
  const tenantUsers = users.filter(u => u.tenant_id === tenant_id);
  return res.status(200).json({
    success: true,
    data: tenantUsers,
    pagination: { total: tenantUsers.length, page: 1, limit: 10 },
  });
});

app.post('/api/users', mockAuth('tenant_admin'), (req, res) => {
  const { username, email, password, role } = req.body;
  const { user: currentUser } = req;
  
  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required',
    });
  }
  
  // Check for duplicate
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Username or email already exists',
    });
  }
  
  // Role-based authorization
  const requestedRole = role || 'user';
  
  if (currentUser.role === 'tenant_admin') {
    if (!['user', 'teacher'].includes(requestedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Tenant admins can only create user or teacher roles',
      });
    }
  }
  
  // Create user
  const newUser = {
    user_id: users.length + 1,
    username,
    email,
    role: requestedRole,
    tenant_id: currentUser.tenant_id,
  };
  
  users.push(newUser);
  
  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: newUser,
  });
});

app.get('/api/users/profile/me', mockAuth('user'), (req, res) => {
  const user = users.find(u => u.user_id === req.user.user_id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    user,
  });
});

app.put('/api/users/:id', mockAuth('tenant_admin'), (req, res) => {
  const userId = parseInt(req.params.id);
  const { role: currentUserRole, tenant_id } = req.user;
  
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  // Tenant admin can only modify users in their tenant
  if (currentUserRole === 'tenant_admin' && users[userIndex].tenant_id !== tenant_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot modify users from other tenants',
    });
  }
  
  // Update user
  users[userIndex] = { ...users[userIndex], ...req.body, user_id: userId };
  
  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: users[userIndex],
  });
});

app.delete('/api/users/:id', mockAuth('tenant_admin'), (req, res) => {
  const userId = parseInt(req.params.id);
  const { role: currentUserRole, tenant_id } = req.user;
  
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  // Tenant admin can only delete users in their tenant
  if (currentUserRole === 'tenant_admin' && users[userIndex].tenant_id !== tenant_id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot delete users from other tenants',
    });
  }
  
  users.splice(userIndex, 1);
  
  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

const request = supertest(app);

describe('User Routes - Role-Based Authorization', () => {
  beforeEach(() => {
    // Reset users before each test
    users = [
      { user_id: 1, username: 'admin', role: 'super_admin', tenant_id: 1, email: 'admin@platform.com' },
      { user_id: 2, username: 'tadmin1', role: 'tenant_admin', tenant_id: 1, email: 'tadmin@tenant1.com' },
      { user_id: 3, username: 'teacher1', role: 'teacher', tenant_id: 1, email: 'teacher@tenant1.com' },
      { user_id: 4, username: 'user1', role: 'user', tenant_id: 1, email: 'user@tenant1.com' },
      { user_id: 5, username: 'tadmin2', role: 'tenant_admin', tenant_id: 2, email: 'tadmin@tenant2.com' },
    ];
  });

  describe('POST /api/users - Super Admin', () => {
    beforeEach(() => {
      // Override middleware for super_admin
      app._router.stack.forEach((layer) => {
        if (layer.route?.path === '/api/users' && layer.route.methods.post) {
          layer.route.stack[0].handle = mockAuth('super_admin');
        }
      });
    });

    it('should allow super_admin to create another super_admin', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'superadmin2',
          email: 'admin2@platform.com',
          password: 'securepass123',
          role: 'super_admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('super_admin');
    });

    it('should allow super_admin to create tenant_admin', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'tadmin3',
          email: 'tadmin3@platform.com',
          password: 'securepass123',
          role: 'tenant_admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('tenant_admin');
    });
  });

  describe('POST /api/users - Tenant Admin', () => {
    it('should allow tenant_admin to create teacher', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'teacher2',
          email: 'teacher2@tenant1.com',
          password: 'securepass123',
          role: 'teacher',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('teacher');
      expect(response.body.user.tenant_id).toBe(1);
    });

    it('should allow tenant_admin to create regular user', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'user2',
          email: 'user2@tenant1.com',
          password: 'securepass123',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('user');
    });

    it('should reject tenant_admin creating super_admin', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'hackadmin',
          email: 'hack@tenant1.com',
          password: 'securepass123',
          role: 'super_admin',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant admins can only create user or teacher roles');
    });

    it('should reject tenant_admin creating another tenant_admin', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'tadmin4',
          email: 'tadmin4@tenant1.com',
          password: 'securepass123',
          role: 'tenant_admin',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Tenant admins can only create user or teacher roles');
    });

    it('should default to user role when not specified', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'defaultuser',
          email: 'default@tenant1.com',
          password: 'securepass123',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('user');
    });
  });

  describe('GET /api/users - List Users', () => {
    it('should return all users for super_admin', async () => {
      // Override middleware for super_admin
      app._router.stack.forEach((layer) => {
        if (layer.route?.path === '/api/users' && layer.route.methods.get) {
          layer.route.stack[0].handle = mockAuth('super_admin');
        }
      });

      const response = await request.get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5);
    });

    it('should return only tenant users for tenant_admin', async () => {
      const response = await request.get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(4); // Only tenant_id: 1 users
      expect(response.body.data.every(u => u.tenant_id === 1)).toBe(true);
    });
  });

  describe('GET /api/users/profile/me - Profile', () => {
    it('should return current user profile for any authenticated user', async () => {
      const response = await request.get('/api/users/profile/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    it('should allow tenant_admin to update user in their tenant', async () => {
      const response = await request
        .put('/api/users/3')
        .send({
          user_fname: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.user_fname).toBe('Updated Name');
    });

    it('should reject tenant_admin updating user from different tenant', async () => {
      const response = await request
        .put('/api/users/5')
        .send({
          user_fname: 'Hacker',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Cannot modify users from other tenants');
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    it('should allow tenant_admin to delete user in their tenant', async () => {
      const response = await request.delete('/api/users/4');

      expect(response.status).toBe(200);
      expect(users.find(u => u.user_id === 4)).toBeUndefined();
    });

    it('should reject tenant_admin deleting user from different tenant', async () => {
      const response = await request.delete('/api/users/5');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Cannot delete users from other tenants');
    });
  });

  describe('Validation', () => {
    it('should reject user creation without required fields', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'incomplete',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should reject duplicate username', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'teacher1', // Already exists
          email: 'newteacher@tenant1.com',
          password: 'securepass123',
          role: 'teacher',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject duplicate email', async () => {
      const response = await request
        .post('/api/users')
        .send({
          username: 'newteacher',
          email: 'teacher@tenant1.com', // Already exists
          password: 'securepass123',
          role: 'teacher',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });
});
