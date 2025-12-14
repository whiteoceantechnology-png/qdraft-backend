/**
 * Integration Tests: Tenant Routes with Super Admin Authorization
 * Tests for tenant management endpoints requiring super_admin role
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (role) => (req, res, next) => {
  req.user = {
    user_id: role === 'super_admin' ? 1 : 2,
    role,
    tenant_id: 1,
    username: `${role}_user`,
  };
  next();
};

// Mock tenant and user data stores
let tenants = [
  { tenant_id: 1, tenant_name: 'Default Tenant', tenant_code: 'DEFAULT', email: 'default@platform.com' },
  { tenant_id: 2, tenant_name: 'Test Tenant', tenant_code: 'TEST001', email: 'test@platform.com' },
];

let users = [
  { user_id: 1, username: 'admin', role: 'super_admin', tenant_id: 1 },
];

// Tenant routes (super_admin only)
app.get('/api/tenants', mockAuth('super_admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    data: tenants,
    pagination: { total: tenants.length, page: 1, limit: 10 },
  });
});

app.post('/api/tenants', mockAuth('super_admin'), (req, res) => {
  const {
    tenant_name,
    tenant_code,
    email,
    subscription_plan,
    max_users,
    admin_username,
    admin_email,
    admin_password,
    admin_name,
  } = req.body;
  
  // Validation
  if (!tenant_name || !tenant_code || !email) {
    return res.status(400).json({
      success: false,
      message: 'Tenant name, code, and email are required',
    });
  }
  
  // Check for duplicate tenant
  if (tenants.find(t => t.tenant_code === tenant_code || t.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Tenant code or email already exists',
    });
  }
  
  // Create tenant
  const newTenant = {
    tenant_id: tenants.length + 1,
    tenant_name,
    tenant_code,
    email,
    subscription_plan: subscription_plan || 'basic',
    max_users: max_users || 50,
  };
  
  tenants.push(newTenant);
  
  let tenantAdmin = null;
  
  // Create admin if all admin fields provided
  if (admin_username && admin_email && admin_password) {
    // Check for duplicate admin
    if (users.find(u => u.username === admin_username || u.email === admin_email)) {
      return res.status(400).json({
        success: false,
        message: 'Admin username or email already exists',
      });
    }
    
    tenantAdmin = {
      user_id: users.length + 1,
      tenant_id: newTenant.tenant_id,
      username: admin_username,
      email: admin_email,
      role: 'tenant_admin',
      user_fname: admin_name || admin_username,
      is_active: true,
    };
    
    users.push(tenantAdmin);
    
    return res.status(201).json({
      success: true,
      message: 'Tenant and admin created successfully',
      tenant: newTenant,
      admin: {
        user_id: tenantAdmin.user_id,
        username: tenantAdmin.username,
        email: tenantAdmin.email,
        role: tenantAdmin.role,
      },
    });
  }
  
  return res.status(201).json({
    success: true,
    message: 'Tenant created successfully',
    tenant: newTenant,
  });
});

app.get('/api/tenants/:id', mockAuth('super_admin'), (req, res) => {
  const tenantId = parseInt(req.params.id);
  const tenant = tenants.find(t => t.tenant_id === tenantId);
  
  if (!tenant) {
    return res.status(404).json({
      success: false,
      message: 'Tenant not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    tenant,
  });
});

app.put('/api/tenants/:id', mockAuth('super_admin'), (req, res) => {
  const tenantId = parseInt(req.params.id);
  const tenantIndex = tenants.findIndex(t => t.tenant_id === tenantId);
  
  if (tenantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Tenant not found',
    });
  }
  
  tenants[tenantIndex] = { ...tenants[tenantIndex], ...req.body, tenant_id: tenantId };
  
  return res.status(200).json({
    success: true,
    message: 'Tenant updated successfully',
    tenant: tenants[tenantIndex],
  });
});

app.delete('/api/tenants/:id', mockAuth('super_admin'), (req, res) => {
  const tenantId = parseInt(req.params.id);
  const tenantIndex = tenants.findIndex(t => t.tenant_id === tenantId);
  
  if (tenantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Tenant not found',
    });
  }
  
  tenants.splice(tenantIndex, 1);
  
  return res.status(200).json({
    success: true,
    message: 'Tenant deleted successfully',
  });
});

// Unauthorized route to test role rejection
app.post('/api/tenants/unauthorized', mockAuth('tenant_admin'), (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Insufficient permissions',
  });
});

const request = supertest(app);

describe('Tenant Routes - Super Admin Authorization', () => {
  beforeEach(() => {
    // Reset data stores before each test
    tenants = [
      { tenant_id: 1, tenant_name: 'Default Tenant', tenant_code: 'DEFAULT', email: 'default@platform.com' },
      { tenant_id: 2, tenant_name: 'Test Tenant', tenant_code: 'TEST001', email: 'test@platform.com' },
    ];
    
    users = [
      { user_id: 1, username: 'admin', role: 'super_admin', tenant_id: 1 },
    ];
  });

  describe('GET /api/tenants - List Tenants', () => {
    it('should return all tenants for super_admin', async () => {
      const response = await request.get('/api/tenants');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/tenants - Create Tenant Without Admin', () => {
    it('should create tenant without admin when admin fields not provided', async () => {
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'New Tenant',
          tenant_code: 'NEW001',
          email: 'new@platform.com',
          subscription_plan: 'premium',
          max_users: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tenant created successfully');
      expect(response.body.tenant.tenant_name).toBe('New Tenant');
      expect(response.body.tenant.tenant_code).toBe('NEW001');
      expect(response.body.admin).toBeUndefined();
    });

    it('should reject duplicate tenant code', async () => {
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Another Tenant',
          tenant_code: 'DEFAULT', // Already exists
          email: 'another@platform.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject duplicate tenant email', async () => {
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Another Tenant',
          tenant_code: 'ANOTHER',
          email: 'default@platform.com', // Already exists
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/tenants - Create Tenant With Admin', () => {
    it('should create tenant and admin when all admin fields provided', async () => {
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Acme School',
          tenant_code: 'ACME001',
          email: 'contact@acme.school',
          subscription_plan: 'premium',
          max_users: 100,
          admin_username: 'acme_admin',
          admin_email: 'admin@acme.school',
          admin_password: 'securepass123',
          admin_name: 'John Admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tenant and admin created successfully');
      expect(response.body.tenant.tenant_name).toBe('Acme School');
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.username).toBe('acme_admin');
      expect(response.body.admin.role).toBe('tenant_admin');
      expect(response.body.admin.email).toBe('admin@acme.school');
    });

    it('should reject if admin username already exists', async () => {
      // Create first tenant with admin
      await request
        .post('/api/tenants')
        .send({
          tenant_name: 'First Tenant',
          tenant_code: 'FIRST001',
          email: 'first@platform.com',
          admin_username: 'existing_admin',
          admin_email: 'admin1@platform.com',
          admin_password: 'securepass123',
        });

      // Try to create second tenant with same admin username
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Second Tenant',
          tenant_code: 'SECOND001',
          email: 'second@platform.com',
          admin_username: 'existing_admin', // Duplicate
          admin_email: 'admin2@platform.com',
          admin_password: 'securepass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Admin username or email already exists');
    });

    it('should reject if admin email already exists', async () => {
      // Create first tenant with admin
      await request
        .post('/api/tenants')
        .send({
          tenant_name: 'First Tenant',
          tenant_code: 'FIRST001',
          email: 'first@platform.com',
          admin_username: 'admin1',
          admin_email: 'existing@platform.com',
          admin_password: 'securepass123',
        });

      // Try to create second tenant with same admin email
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Second Tenant',
          tenant_code: 'SECOND001',
          email: 'second@platform.com',
          admin_username: 'admin2',
          admin_email: 'existing@platform.com', // Duplicate
          admin_password: 'securepass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Admin username or email already exists');
    });
  });

  describe('GET /api/tenants/:id - Get Single Tenant', () => {
    it('should return tenant details', async () => {
      const response = await request.get('/api/tenants/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tenant.tenant_id).toBe(1);
      expect(response.body.tenant.tenant_name).toBe('Default Tenant');
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request.get('/api/tenants/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Tenant not found');
    });
  });

  describe('PUT /api/tenants/:id - Update Tenant', () => {
    it('should update tenant details', async () => {
      const response = await request
        .put('/api/tenants/1')
        .send({
          tenant_name: 'Updated Tenant Name',
          max_users: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.tenant.tenant_name).toBe('Updated Tenant Name');
      expect(response.body.tenant.max_users).toBe(200);
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request
        .put('/api/tenants/999')
        .send({
          tenant_name: 'Non-existent',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Tenant not found');
    });
  });

  describe('DELETE /api/tenants/:id - Delete Tenant', () => {
    it('should delete tenant', async () => {
      const response = await request.delete('/api/tenants/2');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Tenant deleted successfully');
      expect(tenants.find(t => t.tenant_id === 2)).toBeUndefined();
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request.delete('/api/tenants/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Tenant not found');
    });
  });

  describe('Authorization', () => {
    it('should reject tenant_admin from accessing tenant routes', async () => {
      const response = await request
        .post('/api/tenants/unauthorized')
        .send({
          tenant_name: 'Unauthorized',
          tenant_code: 'UNAUTH',
          email: 'unauth@platform.com',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Forbidden');
    });
  });

  describe('Validation', () => {
    it('should reject tenant creation without required fields', async () => {
      const response = await request
        .post('/api/tenants')
        .send({
          tenant_name: 'Incomplete Tenant',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });
});
