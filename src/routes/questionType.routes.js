import { Router } from 'express';
import * as questionTypeController from '../controllers/questionType.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

routes.post(
  '/',
  authJwt,
  questionTypeController.createQuestionType
);

routes.get(
  '/',
  authJwt,
  questionTypeController.getQuestionTypes
);

routes.get(
  '/:id',
  authJwt,
  questionTypeController.getQuestionTypeById
);

routes.get(
  '/chapter/:id',
  authJwt,
  questionTypeController.getQuestionTypesByChapterId
);

routes.put(
  '/:id',
  authJwt,
  questionTypeController.updateQuestionType
);

routes.delete(
  '/:id',
  authJwt,
  questionTypeController.deleteQuestionType
);

export default routes;