/**
 * Exam Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import Exam from '../models/exam.model.js';
import Chapter from '../models/chapter.model.js';
import User from '../models/user.model.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * POST /api/exams
 * Create an exam
 */
export async function createExam(req, res, next) {
  try {
    const body = req.body || {};
    const qbs_exam_name = body.qbs_exam_name || body.examName;

    if (!qbs_exam_name || typeof qbs_exam_name !== 'string') {
      return res.status(HTTPStatus.BAD_REQUEST).json({
        message: 'qbs_exam_name is required and must be a string',
      });
    }

    // Validate chapter exists within tenant
    const qbs_chapter_id = body.qbs_chapter_id ? Number(body.qbs_chapter_id) : null;
    if (qbs_chapter_id) {
      const chapter = await Chapter.findOne({
        where: { ...tenantFilter(req), qbs_chapter_id },
      });
      if (!chapter) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: `Chapter not found: ${qbs_chapter_id}`,
        });
      }
    }

    const exam = await Exam.create({
      ...tenantData(req),
      qbs_exam_name,
      qbs_exam_added: body.qbs_exam_added || body.examDate || new Date(),
      trial_user_id: body.trial_user_id || null,
      qbs_chapter_id,
      showFields: body.showFields || {},
      formData: body.formData || {},
      headerContent: body.headerContent || '',
      footerContent: body.footerContent || '',
      editorContents: body.editorContents || {},
      selectedQueType: body.selectedQueType || [],
      patterns: body.patterns || [],
      questions: body.questions || [],
      meta: body.meta || {},
      created_by: req.user.user_id,
      updated_by: req.user.user_id,
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Exam created', exam });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/exams
 * List exams for current user
 */
export async function listExams(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const exams = await Exam.findAll({
      where: {
        ...tenantFilter(req),
        created_by: req.user.user_id,
      },
      attributes: ['qbs_exam_id', 'qbs_exam_name', 'qbs_exam_added', 'created_at'],
      order: [['qbs_exam_id', 'DESC']],
      limit,
      offset: skip,
    });

    return res.status(HTTPStatus.OK).json(exams);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/exams/:id
 * Get exam by ID
 */
export async function getExam(req, res, next) {
  try {
    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: req.params.id,
      },
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username', 'user_fname'] },
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_id', 'qbs_chapter_name'] },
      ],
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    return res.status(HTTPStatus.OK).json(exam);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/exams/:id
 * Update an exam
 */
export async function updateExam(req, res, next) {
  try {
    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: req.params.id,
      },
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    const body = req.body || {};
    const updateData = {
      updated_by: req.user.user_id,
    };

    if (body.qbs_exam_name) updateData.qbs_exam_name = body.qbs_exam_name;
    if (body.qbs_exam_added) updateData.qbs_exam_added = body.qbs_exam_added;
    if (body.qbs_chapter_id !== undefined) updateData.qbs_chapter_id = body.qbs_chapter_id;
    if (body.showFields) updateData.showFields = body.showFields;
    if (body.formData) updateData.formData = body.formData;
    if (body.headerContent !== undefined) updateData.headerContent = body.headerContent;
    if (body.footerContent !== undefined) updateData.footerContent = body.footerContent;
    if (body.editorContents) updateData.editorContents = body.editorContents;
    if (body.selectedQueType) updateData.selectedQueType = body.selectedQueType;
    if (body.patterns) updateData.patterns = body.patterns;
    if (body.questions) updateData.questions = body.questions;
    if (body.meta) updateData.meta = body.meta;

    await exam.update(updateData);

    return res.status(HTTPStatus.OK).json({ message: 'Exam updated', exam });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/exams/:id
 * Delete an exam
 */
export async function deleteExam(req, res, next) {
  try {
    const deleted = await Exam.destroy({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Exam deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/exams/count
 * Get exam count for user
 */
export async function getExamCount(req, res, next) {
  try {
    const count = await Exam.count({
      where: {
        ...tenantFilter(req),
        created_by: req.user.user_id,
      },
    });

    return res.status(HTTPStatus.OK).json({ count });
  } catch (err) {
    return next(err);
  }
}
