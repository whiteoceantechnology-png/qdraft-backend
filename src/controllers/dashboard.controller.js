/**
 * Dashboard Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op, fn, col, literal } from 'sequelize';
import { Question, Exam, Chapter, QuestionType, User, Pattern, Blueprint, Tenant } from '../models/index.js';
import { tenantFilter } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function getStats(req, res, next) {
  try {
    // Check if admin requesting global stats
    if (req.user.role === 'admin' && req.query.global === 'true') {
      // Global stats for admin
      const [tenantCount, userCount, questionCount, examCount] = await Promise.all([
        Tenant.count(),
        User.count(),
        Question.count(),
        Exam.count(),
      ]);

      return res.status(HTTPStatus.OK).json({
        success: true,
        data: {
          tenants: tenantCount,
          users: userCount,
          questions: questionCount,
          exams: examCount,
        },
      });
    }

    // Tenant-specific stats
    const [questionCount, examCount, chapterCount, questionTypeCount] = await Promise.all([
      Question.count({ where: tenantFilter(req) }),
      Exam.count({ where: { ...tenantFilter(req), created_by: req.user.user_id } }),
      Chapter.count({ where: tenantFilter(req) }),
      QuestionType.count({ where: tenantFilter(req) }),
    ]);

    return res.status(HTTPStatus.OK).json({
      success: true,
      data: {
        questions: questionCount,
        exams: examCount,
        chapters: chapterCount,
        questionTypes: questionTypeCount,
      },
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/questions-by-chapter
 * Get question count grouped by chapter (optimized - single query)
 */
export async function getQuestionsByChapter(req, res, next) {
  try {
    const { subjectId, deptId } = req.query;

    const where = { ...tenantFilter(req) };
    if (subjectId) where.qbs_sub_id = subjectId;
    if (deptId) where.qbs_dept_id = deptId;

    const result = await Chapter.findAll({
      where,
      attributes: [
        'qbs_chapter_id',
        'qbs_chapter_name',
        [fn('COUNT', col('questions.qbs_question_id')), 'question_count'],
      ],
      include: [{
        model: Question,
        as: 'questions',
        attributes: [],
        required: false,
      }],
      group: ['Chapter.qbs_chapter_id'],
      subQuery: false,
    });

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/dashboard/questions-by-type
 * Get question count grouped by type (optimized - single query)
 */
export async function getQuestionsByType(req, res, next) {
  try {
    // Get counts directly with GROUP BY
    const counts = await Question.findAll({
      where: tenantFilter(req),
      attributes: [
        'qbs_qst_type_id',
        [fn('COUNT', col('qbs_question_id')), 'question_count'],
      ],
      include: [{
        model: QuestionType,
        as: 'questionType',
        attributes: ['qbs_qs_type_name'],
        required: true,
      }],
      group: ['qbs_qst_type_id', 'questionType.qbs_qs_type_id'],
      raw: true,
      nest: true,
    });

    const result = counts.map(c => ({
      qbs_qs_type_id: c.qbs_qst_type_id,
      qbs_qs_type_name: c.questionType.qbs_qs_type_name,
      question_count: parseInt(c.question_count),
    }));

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

/**
 * GET /api/dashboard/user-stats
 * Get dashboard statistics for current user (optimized)
 */
export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(HTTPStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    // Run all counts in parallel
    const [qbmCount, patternCount, questionCount, typeCounts] = await Promise.all([
      // Count QBM exams created by user
      Exam.count({
        where: {
          ...tenantFilter(req),
          created_by: userId,
        },
      }),
      // Count patterns created by user
      Pattern.count({
        where: {
          ...tenantFilter(req),
          qbs_ptn_added_by: userId,
        },
      }),
      // Count questions created by user
      Question.count({
        where: {
          ...tenantFilter(req),
          qbs_question_added_by: userId,
        },
      }),
      // Get question counts by type in single query with GROUP BY
      Question.findAll({
        where: {
          ...tenantFilter(req),
          qbs_question_added_by: userId,
        },
        attributes: [
          'qbs_qst_type_id',
          [fn('COUNT', col('qbs_question_id')), 'count'],
        ],
        include: [{
          model: QuestionType,
          as: 'questionType',
          attributes: ['qbs_qs_type_name'],
          required: true,
        }],
        group: ['qbs_qst_type_id', 'questionType.qbs_qs_type_id'],
        raw: true,
        nest: true,
      }),
    ]);

    const userBased = {
      qbm: qbmCount,
      patterns: patternCount,
      questions: questionCount,
    };

    const questionCountsParsed = typeCounts
      .map(c => ({
        qbs_qs_type_name: c.questionType.qbs_qs_type_name,
        question_count: String(c.count),
      }))
      .sort((a, b) => a.qbs_qs_type_name.localeCompare(b.qbs_qs_type_name));

    res.status(HTTPStatus.OK).json({
      userBased,
      questionCountsParsed,
    });
  } catch (error) {
    error.status = HTTPStatus.BAD_REQUEST;
    next(error);
  }
}

/**
 * Build last N months labels and boundaries (oldest -> newest)
 */
function buildLastNMonths(n = 12, endDate = new Date()) {
  const months = [];
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
    months.push({
      label,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      start,
      end: new Date(next - 1),
    });
  }
  return months;
}

/**
 * GET /api/dashboard/monthly-stats
 * Get monthly dashboard statistics (blueprints, exams, pieData per dept/sub)
 */
export async function getDashboardMonthlyStats(req, res, next) {
  try {
    const months = buildLastNMonths(12);
    const rangeStart = months[0].start;
    const rangeEnd = months[months.length - 1].end;

    // Blueprints aggregation by month using Sequelize
    const blueprints = await Blueprint.findAll({
      where: {
        ...tenantFilter(req),
        qbs_blp_added_at: {
          [Op.gte]: rangeStart,
          [Op.lte]: rangeEnd,
        },
      },
      attributes: [
        [fn('YEAR', col('qbs_blp_added_at')), 'year'],
        [fn('MONTH', col('qbs_blp_added_at')), 'month'],
        [fn('COUNT', col('qbs_blp_id')), 'count'],
      ],
      group: [fn('YEAR', col('qbs_blp_added_at')), fn('MONTH', col('qbs_blp_added_at'))],
      raw: true,
    });

    const bluePrintStat = months.map((m) => {
      const found = blueprints.find((a) => a.year === m.year && a.month === m.month);
      return { month: m.label, count: found ? parseInt(found.count) : 0 };
    });

    // Exams aggregation by month
    const exams = await Exam.findAll({
      where: {
        ...tenantFilter(req),
        qbs_exam_added: {
          [Op.gte]: rangeStart,
          [Op.lte]: rangeEnd,
        },
      },
      attributes: [
        [fn('YEAR', col('qbs_exam_added')), 'year'],
        [fn('MONTH', col('qbs_exam_added')), 'month'],
        [fn('COUNT', col('qbs_exam_id')), 'count'],
      ],
      group: [fn('YEAR', col('qbs_exam_added')), fn('MONTH', col('qbs_exam_added'))],
      raw: true,
    });

    const examStat = months.map((m) => {
      const found = exams.find((a) => a.year === m.year && a.month === m.month);
      return { month: m.label, count: found ? parseInt(found.count) : 0 };
    });

    // Questions aggregation by dept/sub per month
    const questions = await Question.findAll({
      where: {
        ...tenantFilter(req),
        qbs_question_added: {
          [Op.gte]: rangeStart,
          [Op.lte]: rangeEnd,
        },
      },
      attributes: [
        'qbs_dept_id',
        'qbs_sub_id',
        [fn('YEAR', col('qbs_question_added')), 'year'],
        [fn('MONTH', col('qbs_question_added')), 'month'],
        [fn('COUNT', col('qbs_question_id')), 'count'],
      ],
      group: [
        'qbs_dept_id',
        'qbs_sub_id',
        fn('YEAR', col('qbs_question_added')),
        fn('MONTH', col('qbs_question_added')),
      ],
      raw: true,
    });

    // Group questions by dept/sub
    const deptSubMap = {};
    questions.forEach((q) => {
      const key = `${q.qbs_dept_id}_${q.qbs_sub_id}`;
      if (!deptSubMap[key]) {
        deptSubMap[key] = {
          qbs_dept_id: String(q.qbs_dept_id),
          qbs_sub_id: q.qbs_sub_id,
          monthly: [],
        };
      }
      deptSubMap[key].monthly.push({
        year: q.year,
        month: q.month,
        count: parseInt(q.count),
      });
    });

    const pieData = Object.values(deptSubMap).map((g) => {
      const monthly_counts = months.map((m) => {
        const found = g.monthly.find((mc) => mc.year === m.year && mc.month === m.month);
        return { month: m.label, count: found ? found.count : 0 };
      });
      return {
        qbs_dept_id: g.qbs_dept_id,
        qbs_sub_id: g.qbs_sub_id,
        monthly_counts,
      };
    });

    res.status(HTTPStatus.OK).json({ bluePrintStat, examStat, pieData });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    next(err);
  }
}

