import { Router } from 'express';
import * as questionController from '../controllers/question.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * CRUD
 */
routes.post('/', authJwt, questionController.createQuestion);
routes.get('/', authJwt, questionController.getQuestions);

// Specific routes must come before parameterized routes
routes.post('/qbm', authJwt, questionController.getQuestionsWithRelatedData);
routes.post('/chapter/:chapterId', authJwt, questionController.getQuestionsWithOptions);
routes.get('/count', authJwt, questionController.getQuestionCount);
routes.post('/bulk', authJwt, questionController.bulkCreateQuestions);

routes.get('/:id', authJwt, questionController.getQuestion);
routes.put('/:id', authJwt, questionController.updateQuestion);
routes.delete('/:id', authJwt, questionController.deleteQuestion);

export default routes;