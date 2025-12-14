/**
 * Blueprint Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op, fn, col } from 'sequelize';
import { Blueprint, Chapter, Question, QuestionType } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/blueprints
 * List blueprints
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 20;
    const skip = parseInt(req.query?.skip) || 0;

    const blueprints = await Blueprint.findAll({
      where: {
        ...tenantFilter(req),
        qbs_blp_added_by: req.user.user_id,
      },
      attributes: ['qbs_blp_id', 'qbs_blp_name', 'qbs_blp_added_by', 'qbs_blp_added_at'],
      order: [['qbs_blp_id', 'DESC']],
      limit,
      offset: skip,
    });

    return res.status(HTTPStatus.OK).json(blueprints);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/blueprints/:id
 * Get blueprint by ID
 */
export async function getById(req, res, next) {
  try {
    const blueprint = await Blueprint.findOne({
      where: {
        ...tenantFilter(req),
        qbs_blp_id: req.params.id,
      },
    });

    if (!blueprint) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }

    return res.status(HTTPStatus.OK).json(blueprint);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/blueprints
 * Create blueprint
 */
export async function create(req, res, next) {
  try {
    const body = req.body || {};

    const blueprint = await Blueprint.create({
      ...tenantData(req),
      qbs_blp_name: body.qbs_blp_name,
      qbs_blp_added_by: req.user.user_id,
      qbs_blp_dept_id: body.qbs_blp_dept_id || 0,
      qbs_sub_id: body.qbs_sub_id || req.user.subject_id,
      qbs_creative: body.qbs_creative || 0,
      blueprint_marks: body.blueprint_marks || [],
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Blueprint created', blueprint });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/blueprints/:id
 * Update blueprint
 */
export async function update(req, res, next) {
  try {
    const blueprint = await Blueprint.findOne({
      where: {
        ...tenantFilter(req),
        qbs_blp_id: req.params.id,
      },
    });

    if (!blueprint) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }

    const body = req.body || {};
    const updateData = {};

    if (body.qbs_blp_name) updateData.qbs_blp_name = body.qbs_blp_name;
    if (body.qbs_blp_dept_id) updateData.qbs_blp_dept_id = body.qbs_blp_dept_id;
    if (body.qbs_sub_id) updateData.qbs_sub_id = body.qbs_sub_id;
    if (body.qbs_creative !== undefined) updateData.qbs_creative = body.qbs_creative;
    if (body.blueprint_marks) updateData.blueprint_marks = body.blueprint_marks;

    await blueprint.update(updateData);

    return res.status(HTTPStatus.OK).json({ message: 'Blueprint updated', blueprint });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

// Alias for routes compatibility
export const updateBlueprint = update;

/**
 * DELETE /api/blueprints/:id
 * Delete blueprint
 */
export async function deleteBlueprint(req, res, next) {
  try {
    const deleted = await Blueprint.destroy({
      where: {
        ...tenantFilter(req),
        qbs_blp_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Blueprint deleted successfully' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/blueprints/viewbystats
 * Get Question Type Counts by Chapters (optimized - single query)
 */
export async function getQuestionTypeCountsByChapters(req, res, next) {
  try {
    const { qbs_sub_id } = req.query;

    const chapterWhere = { ...tenantFilter(req) };
    if (qbs_sub_id) chapterWhere.qbs_sub_id = qbs_sub_id;

    // Get chapters
    const chapters = await Chapter.findAll({
      where: chapterWhere,
      attributes: ['qbs_chapter_id', 'qbs_chapter_name'],
    });

    // Get question types
    const questionTypes = await QuestionType.findAll({
      where: tenantFilter(req),
      attributes: ['qbs_qs_type_id', 'qbs_qs_type_name'],
    });

    // Get all counts in a single query with GROUP BY
    const chapterIds = chapters.map(c => c.qbs_chapter_id);
    const counts = await Question.findAll({
      where: {
        ...tenantFilter(req),
        qbs_chapter_id: { [Op.in]: chapterIds },
      },
      attributes: [
        'qbs_chapter_id',
        'qbs_qst_type_id',
        [fn('COUNT', col('qbs_question_id')), 'count'],
      ],
      group: ['qbs_chapter_id', 'qbs_qst_type_id'],
      raw: true,
    });

    // Build lookup map for O(1) access
    const countMap = {};
    counts.forEach(c => {
      const key = `${c.qbs_chapter_id}_${c.qbs_qst_type_id}`;
      countMap[key] = parseInt(c.count);
    });

    // Build result
    const result = chapters.map(chapter => ({
      qbs_chapter_id: chapter.qbs_chapter_id,
      qbs_chapter_name: chapter.qbs_chapter_name,
      questionTypes: questionTypes.map(qt => ({
        qbs_qs_type_id: qt.qbs_qs_type_id,
        qbs_qs_type_name: qt.qbs_qs_type_name,
        count: countMap[`${chapter.qbs_chapter_id}_${qt.qbs_qs_type_id}`] || 0,
      })),
    }));

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
