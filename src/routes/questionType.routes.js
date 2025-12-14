import { Router } from 'express';
import * as questionTypeController from '../controllers/questionType.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

routes.post('/', authJwt, questionTypeController.create);
routes.get('/', authJwt, questionTypeController.list);
routes.get('/count', authJwt, questionTypeController.getCount);
routes.get('/chapter/:chapterId', authJwt, questionTypeController.getByChapter);
routes.get('/:id', authJwt, questionTypeController.getById);
routes.put('/:id', authJwt, questionTypeController.update);
routes.delete('/:id', authJwt, questionTypeController.deleteQuestionType);

export default routes;