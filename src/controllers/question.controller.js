/**
 * Question Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import { Question, QuestionType, Chapter } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/questions/search
 * Get questions with all related data
 */
export async function getQuestionsWithRelatedData(req, res, next) {
  try {
    const { qbs_chapter_id, qbs_qst_ids = [] } = req.query;

    // Build where clause with tenant filter
    const where = { ...tenantFilter(req) };

    if (qbs_chapter_id) {
      where.qbs_chapter_id = Number(qbs_chapter_id);
    }
    if (qbs_qst_ids.length > 0) {
      where.qbs_question_id = { [Op.in]: qbs_qst_ids.map(Number) };
    }

    // Fetch questions
    const questions = await Question.findAll({
      where,
      attributes: [
        'qbs_question_id',
        'qbs_qst_type',
        'qbs_questions',
        'qbs_qst_mark',
        'qbs_solution',
        'qbs_dept_id',
        'qbs_sub_id',
        'qbs_chapter_id',
        'qbs_creative',
        'qbs_question_added_by',
        'options',
      ],
    });

    // Fetch all question types for this tenant
    const quesTypes = await QuestionType.findAll({
      where: tenantFilter(req),
      attributes: ['qbs_qs_type_id', 'marks', 'qbs_qs_type_name', 'name'],
    });

    // Fetch unique chapters
    const uniqueChapterIds = [...new Set(questions.map(q => q.qbs_chapter_id))];
    const chapters = await Chapter.findAll({
      where: {
        ...tenantFilter(req),
        qbs_chapter_id: { [Op.in]: uniqueChapterIds },
      },
      attributes: ['qbs_chapter_id', 'qbs_chapter_name', 'qbs_sub_id', 'qbs_dept_id'],
    });

    const response = {
      questions,
      options: {},
      quesTypes,
      prevQueYears: {},
      chapters,
      examQueIds: [],
      userIdQ: req.user?.user_id || null,
    };

    return res.status(HTTPStatus.OK).json(response);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/questions
 * Create a new question
 */
export async function createQuestion(req, res, next) {
  try {
    const question = await Question.create({
      ...tenantData(req),
      qbs_qst_type: req.body.questionType,
      qbs_qst_type_id: req.body.questionTypeId,
      qbs_questions: req.body.question,
      qbs_solution: req.body.answer,
      qbs_correct_answer: req.body.correctAnswer,
      options: req.body.options?.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option,
        qbs_answer_status: opt.isCorrect ? 1 : 0,
      })) || [],
      qbs_qst_mark: req.body.marks,
      qbs_chapter_id: req.body.chapterId,
      qbs_question_added_by: req.user.user_id,
      qbs_sub_id: req.body.subjectId || req.user.subject_id,
      qbs_dept_id: req.body.deptId || req.user.dept_id || 0,
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/questions
 * Get questions list
 */
export async function getQuestions(req, res, next) {
  try {
    const { chapterId, questionType, limit = 50, skip = 0 } = req.query;

    const where = { ...tenantFilter(req) };
    if (chapterId) where.qbs_chapter_id = chapterId;
    if (questionType) where.qbs_qst_type_id = questionType;

    const questions = await Question.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
    });

    return res.status(HTTPStatus.OK).json(questions);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/questions/:id
 * Get a single question
 */
export async function getQuestion(req, res, next) {
  try {
    const question = await Question.findOne({
      where: {
        ...tenantFilter(req),
        qbs_question_id: req.params.id,
      },
      include: [
        { model: Chapter, as: 'chapter' },
        { model: QuestionType, as: 'questionType' },
      ],
    });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    return res.status(HTTPStatus.OK).json(question);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/questions/:id
 * Update a question
 */
export async function updateQuestion(req, res, next) {
  try {
    const question = await Question.findOne({
      where: {
        ...tenantFilter(req),
        qbs_question_id: req.params.id,
      },
    });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    const updateData = {};
    if (req.body.questionType) updateData.qbs_qst_type = req.body.questionType;
    if (req.body.questionTypeId) updateData.qbs_qst_type_id = req.body.questionTypeId;
    if (req.body.question) updateData.qbs_questions = req.body.question;
    if (req.body.answer) updateData.qbs_solution = req.body.answer;
    if (req.body.correctAnswer) updateData.qbs_correct_answer = req.body.correctAnswer;
    if (req.body.marks) updateData.qbs_qst_mark = req.body.marks;
    if (req.body.chapterId) updateData.qbs_chapter_id = req.body.chapterId;
    if (req.body.options) {
      updateData.options = req.body.options.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option,
        qbs_answer_status: opt.isCorrect ? 1 : 0,
      }));
    }
    updateData.qbs_question_modified_by = req.user.user_id;

    await question.update(updateData);

    return res.status(HTTPStatus.OK).json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/questions/:id
 * Delete a question
 */
export async function deleteQuestion(req, res, next) {
  try {
    const deleted = await Question.destroy({
      where: {
        ...tenantFilter(req),
        qbs_question_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/questions/count
 * Get question count
 */
export async function getQuestionCount(req, res, next) {
  try {
    const { chapterId, subjectId, deptId } = req.query;

    const where = { ...tenantFilter(req) };
    if (chapterId) where.qbs_chapter_id = chapterId;
    if (subjectId) where.qbs_sub_id = subjectId;
    if (deptId) where.qbs_dept_id = deptId;

    const count = await Question.count({ where });

    return res.status(HTTPStatus.OK).json({ count });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/questions/bulk
 * Bulk create questions
 */
export async function bulkCreateQuestions(req, res, next) {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Questions array is required' });
    }

    const questionsToCreate = questions.map(q => ({
      ...tenantData(req),
      qbs_qst_type: q.questionType,
      qbs_qst_type_id: q.questionTypeId,
      qbs_questions: q.question,
      qbs_solution: q.answer,
      qbs_correct_answer: q.correctAnswer,
      options: q.options || [],
      qbs_qst_mark: q.marks,
      qbs_chapter_id: q.chapterId,
      qbs_question_added_by: req.user.user_id,
      qbs_sub_id: q.subjectId || req.user.subject_id,
      qbs_dept_id: q.deptId || req.user.dept_id,
    }));

    const created = await Question.bulkCreate(questionsToCreate);

    return res.status(HTTPStatus.CREATED).json({
      message: `${created.length} questions created successfully`,
      count: created.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/questions/chapter/:chapterId
 * Get questions with options for a specific chapter
 */
export async function getQuestionsWithOptions(req, res, next) {
  try {
    const chapterId = Number(req.params.chapterId);
    const { questionTypeIds, excludeIds } = req.body || {};

    if (!chapterId || isNaN(chapterId)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Valid chapterId is required' });
    }

    // Build where clause
    const where = {
      ...tenantFilter(req),
      qbs_chapter_id: chapterId,
    };

    // Filter by question type IDs if provided
    if (Array.isArray(questionTypeIds) && questionTypeIds.length > 0) {
      where.qbs_qst_type_id = { [Op.in]: questionTypeIds.map(Number) };
    }

    // Exclude specific question IDs if provided
    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      where.qbs_question_id = { [Op.notIn]: excludeIds.map(Number) };
    }

    const questions = await Question.findAll({
      where,
      include: [
        {
          model: QuestionType,
          as: 'questionType',
          attributes: ['qbs_qs_type_id', 'qbs_qs_type_name', 'marks'],
        },
        {
          model: Chapter,
          as: 'chapter',
          attributes: ['qbs_chapter_id', 'qbs_chapter_name'],
        },
      ],
      order: [['qbs_question_id', 'DESC']],
    });

    // Format response with options included
    const formattedQuestions = questions.map(q => {
      const qData = q.toJSON();
      return {
        qbs_question_id: qData.qbs_question_id,
        qbs_qst_type: qData.qbs_qst_type,
        qbs_qst_type_id: qData.qbs_qst_type_id,
        qbs_questions: qData.qbs_questions,
        qbs_solution: qData.qbs_solution,
        qbs_correct_answer: qData.qbs_correct_answer,
        qbs_qst_mark: qData.qbs_qst_mark,
        qbs_chapter_id: qData.qbs_chapter_id,
        qbs_dept_id: qData.qbs_dept_id,
        qbs_sub_id: qData.qbs_sub_id,
        options: qData.options || [],
        questionType: qData.questionType,
        chapter: qData.chapter,
      };
    });

    return res.status(HTTPStatus.OK).json(formattedQuestions);
  } catch (error) {
    next(error);
  }
}
