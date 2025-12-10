/**
 * Chapter Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op, fn, col } from 'sequelize';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';
import Pattern from '../models/pattern.model.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/chapters
 * Get list of chapters with question counts
 */
export async function getList(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 50;
    const skip = parseInt(req.query?.skip) || 0;
    const { subjectId, deptId } = req.query;

    const where = { ...tenantFilter(req) };
    if (subjectId) where.qbs_sub_id = subjectId;
    if (deptId) where.qbs_dept_id = deptId;

    const chapters = await Chapter.findAll({
      where,
      order: [['qbs_chapter_name', 'ASC']],
      limit,
      offset: skip,
    });

    // Get question counts for each chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const questionCount = await Question.count({
          where: {
            ...tenantFilter(req),
            qbs_chapter_id: chapter.qbs_chapter_id,
          },
        });

        return {
          qbs_chapter_id: chapter.qbs_chapter_id,
          qbs_chapter_name: chapter.qbs_chapter_name,
          qbs_sub_id: chapter.qbs_sub_id,
          qbs_dept_id: chapter.qbs_dept_id,
          question_count: questionCount,
        };
      })
    );

    return res.status(HTTPStatus.OK).json(chaptersWithCounts);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/chapters/:id
 * Get chapter by ID
 */
export async function getById(req, res, next) {
  try {
    const chapter = await Chapter.findOne({
      where: {
        ...tenantFilter(req),
        qbs_chapter_id: req.params.id,
      },
    });

    if (!chapter) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }

    return res.status(HTTPStatus.OK).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/chapters
 * Create a chapter
 */
export async function create(req, res, next) {
  try {
    const chapter = await Chapter.create({
      ...tenantData(req),
      qbs_chapter_name: req.body.qbs_chapter_name,
      qbs_dept_id: req.body.qbs_dept_id,
      qbs_sub_id: req.body.qbs_sub_id,
    });

    return res.status(HTTPStatus.CREATED).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/chapters/:id
 * Update a chapter
 */
export async function update(req, res, next) {
  try {
    const chapter = await Chapter.findOne({
      where: {
        ...tenantFilter(req),
        qbs_chapter_id: req.params.id,
      },
    });

    if (!chapter) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }

    const updateData = {};
    if (req.body.qbs_chapter_name) updateData.qbs_chapter_name = req.body.qbs_chapter_name;
    if (req.body.qbs_dept_id) updateData.qbs_dept_id = req.body.qbs_dept_id;
    if (req.body.qbs_sub_id) updateData.qbs_sub_id = req.body.qbs_sub_id;

    await chapter.update(updateData);

    return res.status(HTTPStatus.OK).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/chapters/:id
 * Delete a chapter
 */
export async function deleteChapter(req, res, next) {
  try {
    const deleted = await Chapter.destroy({
      where: {
        ...tenantFilter(req),
        qbs_chapter_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Chapter deleted successfully' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/chapters/by-subject/:subjectId
 * Get chapters by subject ID
 */
export async function getBySubjectId(req, res, next) {
  try {
    const chapters = await Chapter.findAll({
      where: {
        ...tenantFilter(req),
        qbs_sub_id: req.params.subjectId,
      },
      order: [['qbs_chapter_name', 'ASC']],
    });

    return res.status(HTTPStatus.OK).json(chapters);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/chapters/with-patterns
 * Get chapters with pattern counts
 */
export async function getChaptersWithPatternCounts(req, res, next) {
  try {
    const chapters = await Chapter.findAll({
      where: tenantFilter(req),
      order: [['qbs_chapter_name', 'ASC']],
    });

    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const patternCount = await Pattern.count({
          where: {
            ...tenantFilter(req),
            qbs_chapter_id: chapter.qbs_chapter_id,
          },
        });

        return {
          ...chapter.toJSON(),
          pattern_count: patternCount,
        };
      })
    );

    return res.status(HTTPStatus.OK).json(chaptersWithCounts);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/chapters/by-subject/:subId/department/:deptId
 * Get chapters by subject and department
 */
export async function getChaptersBySubjectAndDept(req, res, next) {
  try {
    const { subId, deptId } = req.params;

    const chapters = await Chapter.findAll({
      where: {
        ...tenantFilter(req),
        qbs_sub_id: subId,
        qbs_dept_id: deptId,
      },
      order: [['qbs_chapter_name', 'ASC']],
    });

    return res.status(HTTPStatus.OK).json(chapters);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
