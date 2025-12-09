import { Router } from 'express';
import * as questionController from '../controllers/question.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * CRUD
 */
routes.post(
  '/',
  authJwt,
  questionController.createQuestion
);

routes.get(
  '/',
  authJwt,
  questionController.getQuestions
);

routes.post(
  '/qbm',
  authJwt,
  questionController.getQuestionsWithRelatedData
);
// routes.post(
//   '/qbm',
//   authJwt,
//   questionController.getQuestionForQBM
// );

routes.get(
  '/:id',
  authJwt,
  questionController.getQuestionById
);

routes.put(
  '/:id',
  authJwt,
  questionController.updateQuestion
);

routes.delete(
  '/:id',
  authJwt,
  questionController.deleteQuestion
);

// New routes for chapter based questions with options
routes.post(
  '/chapter/:chapterId',
  authJwt,
  questionController.getQuestionsWithOptions
);

// routes.post(
//   '/with-options',
//   authJwt,
//   questionController.createQuestionWithOptions
// );

// routes.put(
//   '/with-options/:id',
//   authJwt,
//   questionController.updateQuestionWithOptions
// );

export default routes;