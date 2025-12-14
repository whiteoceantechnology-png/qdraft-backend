/**
 * QuestionType Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { QuestionType } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * POST /api/question-types
 * Create a question type
 */
export async function create(req, res, next) {
  try {
    const questionType = await QuestionType.create({
      ...tenantData(req),
      qbs_qs_type_name: req.body.qbs_qs_type_name,
      name: req.body.name || req.body.qbs_qs_type_name,
      marks: req.body.marks || 1,
      subject_id: req.body.subject_id,
      chapter_id: req.body.chapter_id || null,
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Question type created',
      questionType,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/question-types
 * List question types
 */
export async function list(req, res, next) {
  try {
    const { subjectId, chapterId, limit = 100, skip = 0 } = req.query;

    const where = { ...tenantFilter(req) };
    if (subjectId) where.subject_id = subjectId;
    if (chapterId) where.chapter_id = chapterId;

    const questionTypes = await QuestionType.findAll({
      where,
      order: [['qbs_qs_type_id', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
    });

    return res.status(HTTPStatus.OK).json(questionTypes);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/question-types/:id
 * Get question type by ID
 */
export async function getById(req, res, next) {
  try {
    const questionType = await QuestionType.findOne({
      where: {
        ...tenantFilter(req),
        qbs_qs_type_id: req.params.id,
      },
    });

    if (!questionType) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    return res.status(HTTPStatus.OK).json(questionType);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/question-types/:id
 * Update question type
 */
export async function update(req, res, next) {
  try {
    const questionType = await QuestionType.findOne({
      where: {
        ...tenantFilter(req),
        qbs_qs_type_id: req.params.id,
      },
    });

    if (!questionType) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    const updateData = {};
    if (req.body.qbs_qs_type_name) updateData.qbs_qs_type_name = req.body.qbs_qs_type_name;
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.marks !== undefined) updateData.marks = req.body.marks;
    if (req.body.subject_id) updateData.subject_id = req.body.subject_id;
    if (req.body.chapter_id !== undefined) updateData.chapter_id = req.body.chapter_id || null;

    await questionType.update(updateData);

    return res.status(HTTPStatus.OK).json({
      message: 'Question type updated',
      questionType,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/question-types/:id
 * Delete question type
 */
export async function deleteQuestionType(req, res, next) {
  try {
    const deleted = await QuestionType.destroy({
      where: {
        ...tenantFilter(req),
        qbs_qs_type_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Question type deleted' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/question-types/count
 * Get question type count
 */
export async function getCount(req, res, next) {
  try {
    const count = await QuestionType.count({
      where: tenantFilter(req),
    });

    return res.status(HTTPStatus.OK).json({ count });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/question-types/chapter/:chapterId
 * Get question types by chapter ID
 */
export async function getByChapter(req, res, next) {
  try {
    const { chapterId } = req.params;

    const questionTypes = await QuestionType.findAll({
      where: {
        ...tenantFilter(req),
        chapter_id: chapterId,
      },
      order: [['qbs_qs_type_id', 'ASC']],
    });

    return res.status(HTTPStatus.OK).json(questionTypes);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
