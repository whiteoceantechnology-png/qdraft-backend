/**
 * Seed Routes
 * Multi-tenant support
 */

import { Router } from 'express';

import * as SeedController from '../controllers/seed.controller.js';
import { tenantContext } from '../middlewares/tenant.middleware.js';

const routes = new Router();

// Clear all data (super admin only in dev/test)
routes.get('/clear', SeedController.clearAll);

// Clear seed users (optionally tenant-scoped)
routes.get('/users/clear', tenantContext, SeedController.clearSeedUsers);

// Seed users (optionally tenant-scoped)
routes.get('/users/:count?', tenantContext, SeedController.seedUsers);

// Create a new tenant with admin
routes.post('/tenant', SeedController.seedTenant);

export default routes;
