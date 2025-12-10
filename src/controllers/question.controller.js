/**
 * Question Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import { Op, fn, col, literal } from 'sequelize';
import Question from '../models/question.model.js';
import QuestionType from '../models/questiontype.model.js';
import Chapter from '../models/chapter.model.js';
import sequelize from '../config/database.js';

/**
 * GET /api/questions/search
 * Get questions with all related data
 */
export async function getQuestionsWithRelatedData(req, res, next) {
  try {
    const { qbs_chapter_id, qbs_qst_ids = [] } = req.query;
    
    const where = {};
    if (qbs_chapter_id) {
      where.qbs_chapter_id = Number(qbs_chapter_id);
    }
    if (qbs_qst_ids.length > 0) {
      where.qbs_question_id = { [Op.in]: qbs_qst_ids.map(Number) };
    }

    const questions = await Question.findAll({
      where,
      attributes: [
        'qbs_question_id', 'qbs_qst_type', 'qbs_questions', 'qbs_qst_mark',
        'qbs_solution', 'qbs_dept_id', 'qbs_sub_id', 'qbs_chapter_id',
        'qbs_creative', 'qbs_question_added_by'
      ]
    });

    const questionIds = questions.map(q => q.qbs_question_id);
    const options = {};

    const quesTypes = await QuestionType.findAll({
      attributes: ['qbs_qs_type_id', 'marks', 'qbs_qs_type_name', 'name']
    });

    const prevQueYears = {};

    const uniqueChapterIds = [...new Set(questions.map(q => q.qbs_chapter_id))];
    const chapters = await Chapter.findAll({
      where: { qbs_chapter_id: { [Op.in]: uniqueChapterIds } },
      attributes: ['qbs_chapter_id', 'qbs_chapter_name', 'qbs_sub_id', 'qbs_dept_id']
    });

    const examQueIds = questions
      .filter(q => q.qbs_question_id && q.qbs_qst_type)
      .map(q => `${q.qbs_question_id}, ${q.qbs_qst_type}, ${q.qbs_qst_mark}, ${q.qbs_creative || 0}`);

    return res.status(HTTPStatus.OK).json({
      questions,
      options,
      quesTypes,
      prevQueYears,
      chapters,
      examQueIds: examQueIds.length ? [examQueIds] : [],
      userIdQ: req.user?.user_id || null
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const question = await Question.create({
      qbs_qst_type: req.body.questionType,
      qbs_qst_type_id: req.body.questionTypeId,
      qbs_questions: req.body.question,
      qbs_solution: req.body.answer,
      qbs_correct_answer: req.body.correctAnswer,
      options: req.body.options?.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option
      })),
      qbs_qst_mark: req.body.marks,
      qbs_chapter_id: req.body.chapterId,
      qbs_question_added_by: req.user.user_id,
      qbs_sub_id: req.user.subject_id,
      qbs_dept_id: req.user.dept_id
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestions(req, res, next) {
  try {
    const { chapterId, questionType, questionCategory } = req.query;
    const where = {};

    if (chapterId) where.qbs_chapter_id = chapterId;
    if (questionType) where.qbs_qst_type_id = questionType;

    const questions = await Question.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    return res.status(HTTPStatus.OK).json(questions);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionById(req, res, next) {
  try {
    const question = await Question.findOne({
      where: { qbs_question_id: req.params.id },
      include: [
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_name'] },
        { model: QuestionType, as: 'questionType', attributes: ['qbs_qs_type_name'] }
      ]
    });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    return res.status(HTTPStatus.OK).json(question);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const question = await Question.findOne({ where: { qbs_question_id: req.params.id } });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    await question.update({
      qbs_chapter_id: req.body.lesson,
      qbs_qst_type_id: req.body.questionType,
      qbs_questions: req.body.question,
      qbs_solution: req.body.answer,
      qbs_correct_answer: req.body.correctAnswer,
      options: req.body.options?.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option
      })),
      qbs_qst_mark: req.body.marks
    });

    return res.status(HTTPStatus.OK).json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const deleted = await Question.destroy({ where: { qbs_question_id: req.params.id } });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionsWithOptions(req, res, next) {
  try {
    const { selectedCounts } = req.body;
    const { chapterId } = req.params;
    const where = {};

    if (chapterId) where.qbs_chapter_id = parseInt(chapterId);

    let typeCountMap = { ...selectedCounts };
    let allQuestions = [];

    for (const [type_id, count] of Object.entries(typeCountMap)) {
      if (count > 0) {
        // Random selection using ORDER BY RAND()
        const Questions = await Question.findAll({
          where: {
            ...where,
            qbs_qst_type_id: parseInt(type_id)
          },
          order: sequelize.random(),
          limit: parseInt(count)
        });
        allQuestions = [...allQuestions, ...Questions];
      }
    }

    const questionIds = allQuestions.map(q => q.qbs_question_id);

    // Get options from questions
    const questionsWithOptions = await Question.findAll({
      where: { qbs_question_id: { [Op.in]: questionIds } },
      attributes: ['qbs_question_id', 'options']
    });

    const options = [];
    questionsWithOptions.forEach(q => {
      if (Array.isArray(q.options)) {
        q.options.forEach(opt => {
          options.push({
            qbs_opt_id: opt.qbs_opt_id,
            qbs_qst_id: q.qbs_question_id,
            qbs_option_code: opt.qbs_option_code,
            qbs_option: opt.qbs_option,
            qbs_answer_status: opt.qbs_answer_status,
            copy_status: opt.copy_status
          });
        });
      }
    });

    const quesTypes = await QuestionType.findAll({
      attributes: ['qbs_qs_type_id', 'marks', 'qbs_qs_type_name', 'name']
    });

    const chapters = await Chapter.findAll({
      attributes: ['qbs_chapter_id', 'qbs_chapter_name', 'qbs_sub_id', 'qbs_dept_id']
    });

    return res.status(HTTPStatus.OK).json({
      questions: allQuestions,
      options,
      quesTypes,
      chapters
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionForQBM(req, res, next) {
  try {
    const { examName, marks, selectedChapter, selectedQueType } = req.body;
    return res.status(HTTPStatus.OK).json({ examName, marks, selectedChapter, selectedQueType });
  } catch (error) {
    next(error);
  }
}
