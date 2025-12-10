/**
 * Authentication Routes
 * Multi-tenant support
 */

import { Router } from 'express';

import * as AuthController from '../controllers/authentication.controller.js';
import { authLocal, authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * POST /api/auth/login
 * Login with email/password
 */
routes.post('/login', authLocal, AuthController.login);

/**
 * POST /api/auth/register
 * Register a new user
 */
routes.post('/register', AuthController.register);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
routes.get('/me', authJwt, AuthController.getMe);

/**
 * POST /api/auth/change-password
 * Change password
 */
routes.post('/change-password', authJwt, AuthController.changePassword);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
routes.post('/refresh', authJwt, AuthController.refreshToken);

export default routes;
