/**
 * User Routes
 * Protected routes for user management
 */

import { Router } from 'express';
import validate from '../middlewares/validation.middleware.js';

import * as UserController from '../controllers/user.controller.js';
// import { authJwt } from '../services/auth.js';
import { requireTenantAdmin, requireAuth } from '../middlewares/role.middleware.js';

import * as AuthController from '../controllers/authentication.controller.js';
import { authLocal, authJwt } from '../services/auth.js';
import { authRateLimit } from '../middlewares/performance.middleware.js';

const routes = new Router();

/**
 * @route GET /api/users
 * @desc List users in tenant
 * @access Private/TenantAdmin or SuperAdmin
 */
routes.get('/', authJwt, requireTenantAdmin, UserController.list);

// routes.post('/login', authRateLimit, validate(AuthController.validation.login), authLocal, AuthController.login);
/**
 * @route GET /api/users/profile/me
 * @desc Get current user profile
 * @access Private/Authenticated
 */
routes.get('/profile/me', authJwt, requireAuth, UserController.getProfile);

/**
 * @route PUT /api/users/profile/me
 * @desc Update current user profile
 * @access Private/Authenticated
 */
routes.put('/profile/me', authJwt, requireAuth, UserController.updateProfile);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private/TenantAdmin or SuperAdmin
 */
routes.get('/:id', authJwt, requireTenantAdmin, UserController.getById);

/**
 * @route POST /api/users
 * @desc Create user (tenant admin can create user/teacher, super admin can create any role)
 * @access Private/TenantAdmin or SuperAdmin
 */
routes.post(
  '/',
  authJwt,
  requireTenantAdmin,
  validate(UserController.validation.create),
  UserController.create,
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private/TenantAdmin or SuperAdmin
 */
routes.put('/:id', authJwt, requireTenantAdmin, UserController.update);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/TenantAdmin or SuperAdmin
 */
routes.delete('/:id', authJwt, requireTenantAdmin, UserController.deleteUser);

export default routes;
