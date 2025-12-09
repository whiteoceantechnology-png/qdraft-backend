import { Router } from 'express';
import { authJwt } from '../services/auth.js';
import { getDashboardStats, getDashboardMonthlyStats } from '../controllers/dashboard.controller.js';

const routes = new Router();
/**
 * @api {get} /api/dashboard Get dashboard statistics
 * @apiName GetDashboardStats
 * @apiGroup Dashboard
 * @apiSuccess {Array} userBased Array of user counts by status
 * @apiSuccess {Array} questionCountsParsed Array of question counts by type
 */
routes.get('/', authJwt, getDashboardStats);
routes.get('/monthly', authJwt, getDashboardMonthlyStats);

export default routes;