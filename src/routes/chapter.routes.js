/**
 * Chapter Routes
 */

import { Router } from 'express';
import * as ChapterController from '../controllers/chapter.controller.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

/**
 * CRUD
 */
routes.get('/', authJwt, ChapterController.getList);

// Specific routes must come before parameterized routes
routes.get('/with-patterns', authJwt, ChapterController.getChaptersWithPatternCounts);
routes.get('/by-subject/:subId/department/:deptId', authJwt, ChapterController.getChaptersBySubjectAndDept);

routes.get('/:id', authJwt, ChapterController.getById);
routes.post(
  '/',
  authJwt,
  // validate(ChapterController.validation.create),
  ChapterController.create,
);
routes.patch(
  '/:id',
  authJwt,
  // validate(ChapterController.validation.update),
  ChapterController.update,
);
routes.delete('/:id', authJwt, ChapterController.deleteChapter);

export default routes;
