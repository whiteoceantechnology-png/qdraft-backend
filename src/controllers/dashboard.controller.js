/**
 * Dashboard Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import { Op, fn, col, literal } from 'sequelize';
import Question from '../models/question.model.js';
import Blueprint from '../models/blueprint.model.js';
import Exam from '../models/exam.model.js';
import Pattern from '../models/pattern.model.js';
import QuestionType from '../models/questiontype.model.js';
import sequelize from '../config/database.js';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(HTTPStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    // Count QBM exams created by user
    const qbmCount = await Exam.count({ where: { created_by: userId } });

    // Count patterns created by user
    const chapterCount = await Pattern.count({ where: { qbs_ptn_added_by: userId } });

    // Count questions created by user
    const questionCount = await Question.count({ where: { qbs_question_added_by: userId } });

    const userBased = {
      qbm: qbmCount,
      chapter: chapterCount,
      questions: questionCount
    };

    // Get question counts by type (filtered by user)
    const questionCounts = await Question.findAll({
      where: { qbs_question_added_by: userId },
      attributes: [
        'qbs_qst_type_id',
        [fn('COUNT', col('qbs_question_id')), 'question_count']
      ],
      group: ['qbs_qst_type_id'],
      raw: true
    });

    // Get question type names
    const typeIds = questionCounts.map(q => q.qbs_qst_type_id).filter(Boolean);
    const types = typeIds.length ? await QuestionType.findAll({
      where: { qbs_qs_type_id: { [Op.in]: typeIds } },
      attributes: ['qbs_qs_type_id', 'qbs_qs_type_name'],
      raw: true
    }) : [];

    const typeMap = {};
    types.forEach(t => { typeMap[t.qbs_qs_type_id] = t.qbs_qs_type_name; });

    const questionCountsParsed = questionCounts.map(q => ({
      qbs_qs_type_name: typeMap[q.qbs_qst_type_id] || `type_${q.qbs_qst_type_id}`,
      question_count: String(q.question_count)
    })).sort((a, b) => a.qbs_qs_type_name.localeCompare(b.qbs_qs_type_name));

    res.status(HTTPStatus.OK).json({
      userBased,
      questionCountsParsed
    });
  } catch (error) {
    next(error);
  }
}

// Build last N months labels and boundaries
function buildLastNMonths(n = 12, endDate = new Date()) {
  const months = [];
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
    months.push({ label, year: d.getFullYear(), month: d.getMonth() + 1, start, end: new Date(next - 1) });
  }
  return months;
}

/**
 * Get monthly dashboard statistics
 */
export async function getDashboardMonthlyStats(req, res, next) {
  try {
    const months = buildLastNMonths(12);
    const rangeStart = months[0].start;
    const rangeEnd = months[months.length - 1].end;

    // Blueprints by month
    const blpResults = await Blueprint.findAll({
      where: {
        qbs_blp_added_at: { [Op.between]: [rangeStart, rangeEnd] }
      },
      attributes: [
        [fn('YEAR', col('qbs_blp_added_at')), 'year'],
        [fn('MONTH', col('qbs_blp_added_at')), 'month'],
        [fn('COUNT', col('qbs_blp_id')), 'count']
      ],
      group: [fn('YEAR', col('qbs_blp_added_at')), fn('MONTH', col('qbs_blp_added_at'))],
      raw: true
    });

    const bluePrintStat = months.map(m => {
      const found = blpResults.find(a => a.year === m.year && a.month === m.month);
      return { month: m.label, count: found ? Number(found.count) : 0 };
    });

    // Exams by month
    const exResults = await Exam.findAll({
      where: {
        qbs_exam_added: { [Op.between]: [rangeStart, rangeEnd] }
      },
      attributes: [
        [fn('YEAR', col('qbs_exam_added')), 'year'],
        [fn('MONTH', col('qbs_exam_added')), 'month'],
        [fn('COUNT', col('qbs_exam_id')), 'count']
      ],
      group: [fn('YEAR', col('qbs_exam_added')), fn('MONTH', col('qbs_exam_added'))],
      raw: true
    });

    const examStat = months.map(m => {
      const found = exResults.find(a => a.year === m.year && a.month === m.month);
      return { month: m.label, count: found ? Number(found.count) : 0 };
    });

    // Questions by dept/sub per month
    const qResults = await Question.findAll({
      where: {
        qbs_question_added: { [Op.between]: [rangeStart, rangeEnd] }
      },
      attributes: [
        'qbs_dept_id',
        'qbs_sub_id',
        [fn('YEAR', col('qbs_question_added')), 'year'],
        [fn('MONTH', col('qbs_question_added')), 'month'],
        [fn('COUNT', col('qbs_question_id')), 'count']
      ],
      group: ['qbs_dept_id', 'qbs_sub_id', fn('YEAR', col('qbs_question_added')), fn('MONTH', col('qbs_question_added'))],
      raw: true
    });

    // Group by dept/sub
    const grouped = {};
    qResults.forEach(r => {
      const key = `${r.qbs_dept_id}_${r.qbs_sub_id}`;
      if (!grouped[key]) {
        grouped[key] = { dept: r.qbs_dept_id, sub: r.qbs_sub_id, monthly: [] };
      }
      grouped[key].monthly.push({ year: r.year, month: r.month, count: Number(r.count) });
    });

    const pieData = Object.values(grouped).map(g => {
      const monthly_counts = months.map(m => {
        const found = g.monthly.find(mc => mc.year === m.year && mc.month === m.month);
        return { month: m.label, count: found ? found.count : 0 };
      });
      return { qbs_dept_id: String(g.dept), qbs_sub_id: g.sub, monthly_counts };
    });

    res.status(HTTPStatus.OK).json({ bluePrintStat, examStat, pieData });
  } catch (err) {
    next(err);
  }
}
