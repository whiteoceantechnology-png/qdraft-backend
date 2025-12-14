/**
 * Pattern Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import { Pattern, Chapter } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * POST /api/patterns
 * Create a pattern
 */
export async function createPattern(req, res, next) {
  try {
    const body = req.body || {};

    // Validate chapter exists within tenant
    if (body.qbs_chapter_id) {
      const chapter = await Chapter.findOne({
        where: {
          ...tenantFilter(req),
          qbs_chapter_id: body.qbs_chapter_id,
        },
      });
      if (!chapter) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: `Chapter not found: ${body.qbs_chapter_id}`,
        });
      }
    }

    const pattern = await Pattern.create({
      ...tenantData(req),
      qbs_ptn_name: body.qbs_ptn_name,
      qbs_chapter_id: body.qbs_chapter_id,
      total_mark: body.total_mark || 0,
      sub_notes: body.sub_notes || {},
      qbs_ptn_questions: body.qbs_ptn_questions || [],
      qbs_ptn_added_by: req.user.user_id,
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Pattern created', pattern });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/patterns
 * List patterns
 */
export async function listPatterns(req, res, next) {
  try {
    const { chapterId, limit = 50, skip = 0 } = req.query;

    const where = { ...tenantFilter(req) };
    if (chapterId) where.qbs_chapter_id = chapterId;

    const patterns = await Pattern.findAll({
      where,
      include: [
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_id', 'qbs_chapter_name'] },
      ],
      order: [['qbs_ptn_id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
    });

    return res.status(HTTPStatus.OK).json(patterns);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/patterns/:id
 * Get pattern by ID
 */
export async function getPattern(req, res, next) {
  try {
    const pattern = await Pattern.findOne({
      where: {
        ...tenantFilter(req),
        qbs_ptn_id: req.params.id,
      },
      include: [
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_id', 'qbs_chapter_name'] },
      ],
    });

    if (!pattern) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    }

    return res.status(HTTPStatus.OK).json(pattern);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/patterns/:id
 * Update a pattern
 */
export async function updatePattern(req, res, next) {
  try {
    const pattern = await Pattern.findOne({
      where: {
        ...tenantFilter(req),
        qbs_ptn_id: req.params.id,
      },
    });

    if (!pattern) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    }

    const body = req.body || {};
    const updateData = {};

    if (body.qbs_ptn_name) updateData.qbs_ptn_name = body.qbs_ptn_name;
    if (body.qbs_chapter_id) updateData.qbs_chapter_id = body.qbs_chapter_id;
    if (body.total_mark !== undefined) updateData.total_mark = body.total_mark;
    if (body.sub_notes) updateData.sub_notes = body.sub_notes;
    if (body.qbs_ptn_questions) updateData.qbs_ptn_questions = body.qbs_ptn_questions;

    await pattern.update(updateData);

    return res.status(HTTPStatus.OK).json({ message: 'Pattern updated', pattern });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/patterns/:id
 * Delete a pattern
 */
export async function deletePattern(req, res, next) {
  try {
    const deleted = await Pattern.destroy({
      where: {
        ...tenantFilter(req),
        qbs_ptn_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Pattern deleted' });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/patterns (bulk delete)
 * Delete multiple patterns
 */
export async function deletePatterns(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'No pattern IDs provided' });
    }

    const deleted = await Pattern.destroy({
      where: {
        ...tenantFilter(req),
        qbs_ptn_id: { [Op.in]: ids },
      },
    });

    return res.status(HTTPStatus.OK).json({ message: `${deleted} patterns deleted` });
  } catch (err) {
    return next(err);
  }
}
