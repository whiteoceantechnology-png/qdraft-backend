/**
 * Blueprints Routes
 */

import { Router } from 'express';
import validate from 'express-validation';

import * as BlueprintController from '../controllers/blueprint.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * CRUD
 */
routes.get('/', authJwt, BlueprintController.list);
routes.get('/viewbystats', authJwt, BlueprintController.getQuestionTypeCountsByChapters);
routes.get('/:id', authJwt, BlueprintController.getById);
routes.post(
  '/',
  authJwt,
  // validate(BlueprintController.validation.create),
  BlueprintController.create,
);
routes.patch(
  '/:id',
  authJwt,
  // validate(BlueprintController.validation.update),
  BlueprintController.updateBlueprint,
);
routes.delete('/:id', authJwt, BlueprintController.deleteBlueprint);


export default routes;
