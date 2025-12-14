import { Router } from 'express';
import * as patternController from '../controllers/pattern.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

routes.post('/', authJwt, patternController.createPattern);
routes.get('/', authJwt, patternController.listPatterns);
routes.get('/:id', authJwt, patternController.getPattern);
routes.put('/:id', authJwt, patternController.updatePattern);
routes.delete('/:id', authJwt, patternController.deletePattern);
routes.delete('/', authJwt, patternController.deletePatterns);

export default routes;
