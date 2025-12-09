import { Router } from 'express';
import * as examController from '../controllers/exam.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

routes.post('/', authJwt, examController.createExam);
routes.get('/', authJwt, examController.listExams);
routes.get('/:id', authJwt, examController.getExam);
routes.get('/:id/form', authJwt, examController.getExamFormById);
routes.put('/:id', authJwt, examController.updateExam);
routes.patch('/:id/questions', authJwt, examController.updateExamQuestion);
routes.delete('/:id', authJwt, examController.deleteExam);

export default routes;
