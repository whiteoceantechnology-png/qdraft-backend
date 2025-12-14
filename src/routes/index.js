/**
 * API Routes
 * Multi-tenant support
 */

import { Router } from 'express';
import HTTPStatus from 'http-status';

import BluePrintRoutes from './blueprint.routes.js';
import ChapterRoutes from './chapter.routes.js';
import DashboardRoutes from './dashboard.routes.js';
import ExamRoutes from './exam.routes.js';
import PatternRoutes from './pattern.routes.js';
import PostRoutes from './post.routes.js';
import QuestionRoutes from './question.routes.js';
import QuestionTypeRoutes from './questionType.routes.js';
import SeedRoutes from './seed.routes.js';
import UserRoutes from './user.routes.js';
import AuthRoutes from './auth.routes.js';
import TenantRoutes from './tenant.routes.js';
import SubjectRoutes from './subject.routes.js';

import APIError from '../services/error.js';

// Middlewares
import logErrorService from '../services/log.js';
import { tenantContext } from '../middlewares/tenant.middleware.js';

const routes = new Router();

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Auth routes (public, no tenant context required for login/register)
routes.use('/auth', AuthRoutes);

// Admin routes (tenant management)
routes.use('/tenants', TenantRoutes);

// Protected routes with tenant context
routes.use('/blueprints', tenantContext, BluePrintRoutes);
routes.use('/chapters', tenantContext, ChapterRoutes);
routes.use('/dashboard', tenantContext, DashboardRoutes);
routes.use('/exams', tenantContext, ExamRoutes);
routes.use('/patterns', tenantContext, PatternRoutes);
routes.use('/posts', tenantContext, PostRoutes);
routes.use('/questions', tenantContext, QuestionRoutes);
routes.use('/questiontypes', tenantContext, QuestionTypeRoutes);
routes.use('/subjects', tenantContext, SubjectRoutes);
routes.use('/users', tenantContext, UserRoutes);

if (isDev || isTest) {
  routes.use('/seeds', SeedRoutes);
}

routes.all('*', (req, res, next) =>
  next(new APIError('Not Found!', HTTPStatus.NOT_FOUND, true)),
);

routes.use(logErrorService);

export default routes;
