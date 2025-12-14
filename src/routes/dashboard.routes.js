import { Router } from 'express';
import { authJwt } from '../services/auth.js';
import {
  getStats,
  getQuestionsByChapter,
  getQuestionsByType,
  getRecentExams,
  getRecentQuestions,
  getTenantOverview,
  getDashboardStats,
  getDashboardMonthlyStats,
} from '../controllers/dashboard.controller.js';

const routes = new Router();

/**
 * @api {get} /api/dashboard/stats Get basic dashboard stats
 * @apiName GetStats
 * @apiGroup Dashboard
 */
// /api/dashboard/
routes.get('/', authJwt, getDashboardStats);

/**
 * @api {get} /api/dashboard/user-stats Get user-based dashboard statistics
 * @apiName GetDashboardStats
 * @apiGroup Dashboard
 * @apiSuccess {Object} userBased User counts (qbm, patterns, questions)
 * @apiSuccess {Array} questionCountsParsed Array of question counts by type
 */
// routes.get('/user-stats', authJwt, getDashboardStats);

/**
 * @api {get} /api/dashboard/monthly Get monthly dashboard statistics
 * @apiName GetDashboardMonthlyStats
 * @apiGroup Dashboard
 * @apiSuccess {Array} bluePrintStat Monthly blueprint counts
 * @apiSuccess {Array} examStat Monthly exam counts
 * @apiSuccess {Array} pieData Monthly question counts by dept/sub
 */
routes.get('/monthly', authJwt, getDashboardMonthlyStats);

/**
 * @api {get} /api/dashboard/questions-by-chapter Get questions grouped by chapter
 * @apiName GetQuestionsByChapter
 * @apiGroup Dashboard
 * @apiQuery {String} [subjectId] Filter by subject
 * @apiQuery {String} [deptId] Filter by department
 */
routes.get('/questions-by-chapter', authJwt, getQuestionsByChapter);

/**
 * @api {get} /api/dashboard/questions-by-type Get questions grouped by type
 * @apiName GetQuestionsByType
 * @apiGroup Dashboard
 */
routes.get('/questions-by-type', authJwt, getQuestionsByType);

/**
 * @api {get} /api/dashboard/recent-exams Get recent exams
 * @apiName GetRecentExams
 * @apiGroup Dashboard
 * @apiQuery {Number} [limit=10] Number of exams to return
 */
routes.get('/recent-exams', authJwt, getRecentExams);

/**
 * @api {get} /api/dashboard/recent-questions Get recent questions
 * @apiName GetRecentQuestions
 * @apiGroup Dashboard
 * @apiQuery {Number} [limit=10] Number of questions to return
 */
routes.get('/recent-questions', authJwt, getRecentQuestions);

/**
 * @api {get} /api/dashboard/tenant-overview Get tenant overview (for admins)
 * @apiName GetTenantOverview
 * @apiGroup Dashboard
 */
routes.get('/tenant-overview', authJwt, getTenantOverview);

export default routes;