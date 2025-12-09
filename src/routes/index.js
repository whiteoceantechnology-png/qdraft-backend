/**
 * API Routes
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

import APIError from '../services/error.js';

// Middlewares
import logErrorService from '../services/log.js';

const routes = new Router();

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

routes.use('/blueprints', BluePrintRoutes);
routes.use('/chapters', ChapterRoutes);
routes.use('/dashboard', DashboardRoutes);
routes.use('/exams', ExamRoutes);
routes.use('/patterns', PatternRoutes);
routes.use('/posts', PostRoutes);
routes.use('/questions', QuestionRoutes);
routes.use('/questiontypes', QuestionTypeRoutes);
routes.use('/users', UserRoutes);

if (isDev || isTest) {
  routes.use('/seeds', SeedRoutes);
}

routes.all('*', (req, res, next) =>
  next(new APIError('Not Found!', HTTPStatus.NOT_FOUND, true)),
);

routes.use(logErrorService);

export default routes;
