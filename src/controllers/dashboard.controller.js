/**
 * Dashboard Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { fn, col, literal } from 'sequelize';
import Question from '../models/question.model.js';
import Exam from '../models/exam.model.js';
import Chapter from '../models/chapter.model.js';
import QuestionType from '../models/questiontype.model.js';
import User from '../models/user.model.js';
import { tenantFilter } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function getStats(req, res, next) {
  try {
    const [questionCount, examCount, chapterCount, questionTypeCount] = await Promise.all([
      Question.count({ where: tenantFilter(req) }),
      Exam.count({ where: { ...tenantFilter(req), created_by: req.user.user_id } }),
      Chapter.count({ where: tenantFilter(req) }),
      QuestionType.count({ where: tenantFilter(req) }),
    ]);

    return res.status(HTTPStatus.OK).json({
      questions: questionCount,
      exams: examCount,
      chapters: chapterCount,
      questionTypes: questionTypeCount,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/questions-by-chapter
 * Get question count grouped by chapter
 */
export async function getQuestionsByChapter(req, res, next) {
  try {
    const { subjectId, deptId } = req.query;

    const where = { ...tenantFilter(req) };
    if (subjectId) where.qbs_sub_id = subjectId;
    if (deptId) where.qbs_dept_id = deptId;

    const chapters = await Chapter.findAll({ where });

    const result = await Promise.all(
      chapters.map(async (chapter) => {
        const count = await Question.count({
          where: {
            ...tenantFilter(req),
            qbs_chapter_id: chapter.qbs_chapter_id,
          },
        });

        return {
          qbs_chapter_id: chapter.qbs_chapter_id,
          qbs_chapter_name: chapter.qbs_chapter_name,
          question_count: count,
        };
      })
    );

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/questions-by-type
 * Get question count grouped by type
 */
export async function getQuestionsByType(req, res, next) {
  try {
    const questionTypes = await QuestionType.findAll({
      where: tenantFilter(req),
    });

    const result = await Promise.all(
      questionTypes.map(async (qt) => {
        const count = await Question.count({
          where: {
            ...tenantFilter(req),
            qbs_qst_type_id: qt.qbs_qs_type_id,
          },
        });

        return {
          qbs_qs_type_id: qt.qbs_qs_type_id,
          qbs_qs_type_name: qt.qbs_qs_type_name,
          question_count: count,
        };
      })
    );

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/recent-exams
 * Get recent exams
 */
export async function getRecentExams(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const exams = await Exam.findAll({
      where: {
        ...tenantFilter(req),
        created_by: req.user.user_id,
      },
      attributes: ['qbs_exam_id', 'qbs_exam_name', 'qbs_exam_added', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
    });

    return res.status(HTTPStatus.OK).json(exams);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/recent-questions
 * Get recently added questions
 */
export async function getRecentQuestions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const questions = await Question.findAll({
      where: tenantFilter(req),
      attributes: [
        'qbs_question_id',
        'qbs_questions',
        'qbs_qst_type',
        'qbs_chapter_id',
        'created_at',
      ],
      include: [
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    return res.status(HTTPStatus.OK).json(questions);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/tenant-overview
 * Get tenant overview (for tenant admins)
 */
export async function getTenantOverview(req, res, next) {
  try {
    const [questionCount, examCount, chapterCount, userCount] = await Promise.all([
      Question.count({ where: tenantFilter(req) }),
      Exam.count({ where: tenantFilter(req) }),
      Chapter.count({ where: tenantFilter(req) }),
      User.count({ where: tenantFilter(req) }),
    ]);

    return res.status(HTTPStatus.OK).json({
      questions: questionCount,
      exams: examCount,
      chapters: chapterCount,
      users: userCount,
      tenant: req.tenant ? {
        tenant_id: req.tenant.tenant_id,
        tenant_name: req.tenant.tenant_name,
        subscription_plan: req.tenant.subscription_plan,
      } : null,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

