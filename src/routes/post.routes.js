/**
 * Post Routes
 */

import { Router } from 'express';
import validate from '../middlewares/validation.middleware.js';

import * as PostController from '../controllers/post.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * CRUD
 */
routes.get('/', authJwt, PostController.getList);
routes.get('/:id', authJwt, PostController.getById);
routes.post(
  '/',
  authJwt,
  validate(PostController.validation.create),
  PostController.create,
);
routes.patch(
  '/:id',
  authJwt,
  validate(PostController.validation.update),
  PostController.updatePost,
);
routes.delete('/:id', authJwt, PostController.deletePost);

/**
 * Favorites
 */
routes.post('/:id/favorite', authJwt, PostController.favoritePost);

export default routes;
