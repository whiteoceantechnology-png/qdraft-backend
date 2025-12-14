/**
 * Tenant Routes
 * Admin-level routes for tenant management
 */

import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller.js';
import { authJwt } from '../services/auth.js';
import { requireSuperAdmin } from '../middlewares/role.middleware.js';

const routes = new Router();

// All routes require authentication
routes.use(authJwt);

/**
 * @route GET /api/tenants
 * @desc Get all tenants (super admin only)
 * @access Private/SuperAdmin
 */
routes.get('/', requireSuperAdmin, tenantController.getAllTenants);

/**
 * @route GET /api/tenants/:id
 * @desc Get tenant by ID (super admin only)
 * @access Private/SuperAdmin
 */
routes.get('/:id', requireSuperAdmin, tenantController.getTenantById);

/**
 * @route POST /api/tenants
 * @desc Create new tenant (with optional tenant admin)
 * @access Private/SuperAdmin
 */
routes.post('/', requireSuperAdmin, tenantController.createTenant);

/**
 * @route PUT /api/tenants/:id
 * @desc Update tenant (super admin only)
 * @access Private/SuperAdmin
 */
routes.put('/:id', requireSuperAdmin, tenantController.updateTenant);

/**
 * @route DELETE /api/tenants/:id
 * @desc Delete tenant (super admin only)
 * @access Private/SuperAdmin
 */
routes.delete('/:id', requireSuperAdmin, tenantController.deleteTenant);

export default routes;
