/**
 * Authentication Routes
 * Multi-tenant support with rate limiting
 */

import { Router } from 'express';
import validate from '../middlewares/validation.middleware.js';

import * as AuthController from '../controllers/authentication.controller.js';
import { authLocal, authJwt } from '../services/auth.js';
import { authRateLimit } from '../middlewares/performance.middleware.js';

const routes = new Router();

/**
 * POST /api/auth/login
 * Login with email/password (rate limited)
 */
routes.post('/login', authRateLimit, validate(AuthController.validation.login), authLocal, AuthController.login);

/**
 * POST /api/auth/register
 * Register a new user (rate limited)
 */
routes.post('/register', authRateLimit, validate(AuthController.validation.register), AuthController.register);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
routes.get('/me', authJwt, AuthController.getMe);

/**
 * POST /api/auth/change-password
 * Change password (rate limited)
 */
routes.post('/change-password', authJwt, authRateLimit, validate(AuthController.validation.changePassword), AuthController.changePassword);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
routes.post('/refresh', authJwt, AuthController.refreshToken);

export default routes;
