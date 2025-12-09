import HTTPStatus from 'http-status';

import Question from '../models/question.model.js';
import Blueprint from '../models/blueprint.model.js';
import Exam from '../models/exam.model.js';
import Pattern from '../models/pattern.model.js';

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getDashboardStats(req, res, next) {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(HTTPStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        // Count QBM exams created by user
        const qbmCount = await Exam.countDocuments({
            created_by: userId
        }).exec();

        // Count patterns created by user
        const chapterCount = await Pattern.countDocuments({
            qbs_ptn_added_by: userId
        }).exec();

        // Count questions created by user
        const questionCount = await Question.countDocuments({
            qbs_question_added_by: userId
        }).exec();

        const userBased = {
            qbm: qbmCount,
            chapter: chapterCount,
            questions: questionCount
        };

        // Get question counts by type (still filtered by user)
        const questionCountsParsed = await Question.aggregate([
            { $match: { qbs_question_added_by: userId } },
            {
                $lookup: {
                    from: 'questiontypes',
                    localField: 'qbs_qst_type_id',
                    foreignField: 'qbs_qs_type_id',
                    as: 'questionType'
                }
            },
            { $unwind: '$questionType' },
            {
                $group: {
                    _id: {
                        typeId: '$qbs_qs_type_id',
                        typeName: '$questionType.qbs_qs_type_name'
                    },
                    question_count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    qbs_qs_type_name: '$_id.typeName',
                    question_count: { $toString: '$question_count' }
                }
            },
            { $sort: { qbs_qs_type_name: 1 } }
        ]);

        res.status(HTTPStatus.OK).json({
            userBased,
            questionCountsParsed
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        next(error);
    }
};

// Build last N months labels and boundaries (oldest -> newest)
function buildLastNMonths(n = 12, endDate = new Date()) {
    const months = [];
    // clone and set to first day of the month for endDate
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
 * Get monthly dashboard statistics (blueprints, exams, pieData per dept/sub)
 */
export async function getDashboardMonthlyStats(req, res, next) {
    try {
        const months = buildLastNMonths(12);
        const rangeStart = months[0].start;
        const rangeEnd = months[months.length - 1].end;

        // Blueprints aggregation by month
        const blpAgg = await Blueprint.aggregate([
            { $match: { qbs_blp_added_at: { $gte: rangeStart, $lte: rangeEnd } } },
            {
                $group: {
                    _id: { year: { $year: '$qbs_blp_added_at' }, month: { $month: '$qbs_blp_added_at' } },
                    count: { $sum: 1 }
                }
            }
        ]).exec();

        const bluePrintStat = months.map(m => {
            const found = blpAgg.find(a => a._id.year === m.year && a._id.month === m.month);
            return { month: m.label, count: found ? found.count : 0 };
        });

        // Exams aggregation by month
        const exAgg = await Exam.aggregate([
            { $match: { qbs_exam_added: { $gte: rangeStart, $lte: rangeEnd } } },
            {
                $group: {
                    _id: { year: { $year: '$qbs_exam_added' }, month: { $month: '$qbs_exam_added' } },
                    count: { $sum: 1 }
                }
            }
        ]).exec();

        const examStat = months.map(m => {
            const found = exAgg.find(a => a._id.year === m.year && a._id.month === m.month);
            return { month: m.label, count: found ? found.count : 0 };
        });

        // Pie data: questions counts grouped by dept/sub per month
        // Aggregate questions per dept/sub per month
        const qAgg = await Question.aggregate([
            { $match: { qbs_question_added: { $gte: rangeStart, $lte: rangeEnd } } },
            {
                $group: {
                    _id: {
                        dept: '$qbs_dept_id',
                        sub: '$qbs_sub_id',
                        year: { $year: '$qbs_question_added' },
                        month: { $month: '$qbs_question_added' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: { dept: '$_id.dept', sub: '$_id.sub' },
                    monthly: {
                        $push: {
                            year: '$_id.year',
                            month: '$_id.month',
                            count: '$count'
                        }
                    }
                }
            }
        ]).exec();

        const pieData = qAgg.map(g => {
            const monthly_counts = months.map(m => {
                const found = g.monthly.find(mc => mc.year === m.year && mc.month === m.month);
                return { month: m.label, count: found ? found.count : 0 };
            });
            return { qbs_dept_id: String(g._id.dept), qbs_sub_id: g._id.sub, monthly_counts };
        });

        res.status(HTTPStatus.OK).json({ bluePrintStat, examStat, pieData });
    } catch (err) {
        next(err);
    }
}

