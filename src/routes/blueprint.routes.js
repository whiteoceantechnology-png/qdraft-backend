/**
 * Blueprints Routes
 */

import { Router } from 'express';
import * as BlueprintController from '../controllers/blueprint.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

routes.get('/', authJwt, BlueprintController.list);
routes.get('/viewbystats', authJwt, BlueprintController.getQuestionTypeCountsByChapters);
routes.get('/:id', authJwt, BlueprintController.getById);
routes.post('/', authJwt, BlueprintController.create);
routes.patch('/:id', authJwt, BlueprintController.update);
routes.delete('/:id', authJwt, BlueprintController.deleteBlueprint);

export default routes;
