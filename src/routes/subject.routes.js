/**
 * Subject Routes
 * Protected routes for subject management
 */

import { Router } from 'express';
import validate from '../middlewares/validation.middleware.js';
import * as SubjectController from '../controllers/subject.controller.js';
import { authJwt } from '../services/auth.js';
import { requireTenantAdmin, requireAuth } from '../middlewares/role.middleware.js';

const routes = new Router();

/**
 * @route GET /api/subjects
 * @desc List all subjects in tenant
 * @access Private/Authenticated
 */
routes.get('/', authJwt, requireAuth, SubjectController.list);

/**
 * @route GET /api/subjects/:id
 * @desc Get subject by ID
 * @access Private/Authenticated
 */
routes.get('/:id', authJwt, requireAuth, SubjectController.getById);

/**
 * @route GET /api/subjects/:id/users
 * @desc Get users assigned to a subject
 * @access Private/TenantAdmin
 */
routes.get('/:id/users', authJwt, requireTenantAdmin, SubjectController.getUsersBySubject);

/**
 * @route POST /api/subjects
 * @desc Create a new subject
 * @access Private/TenantAdmin
 */
routes.post(
  '/',
  authJwt,
  requireTenantAdmin,
  validate(SubjectController.validation.create),
  SubjectController.create
);

/**
 * @route PUT /api/subjects/:id
 * @desc Update subject
 * @access Private/TenantAdmin
 */
routes.put(
  '/:id',
  authJwt,
  requireTenantAdmin,
  validate(SubjectController.validation.update),
  SubjectController.update
);

/**
 * @route DELETE /api/subjects/:id
 * @desc Delete subject
 * @access Private/TenantAdmin
 */
routes.delete('/:id', authJwt, requireTenantAdmin, SubjectController.deleteSubject);

/**
 * @route POST /api/subjects/assign
 * @desc Assign subject to a user
 * @access Private/TenantAdmin
 */
routes.post(
  '/assign',
  authJwt,
  requireTenantAdmin,
  validate(SubjectController.validation.assignSubject),
  SubjectController.assignSubjectToUser
);

/**
 * @route DELETE /api/subjects/assign/:userId
 * @desc Remove subject assignment from user
 * @access Private/TenantAdmin
 */
routes.delete('/assign/:userId', authJwt, requireTenantAdmin, SubjectController.removeSubjectFromUser);

export default routes;
