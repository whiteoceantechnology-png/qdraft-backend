/**
 * Exam Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import { Exam, Chapter, User, Question, QuestionType } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * POST /api/exams
 * Create an exam
 */
export async function createExam(req, res, next) {
  try {
    const body = req.body || {};
    const qbs_exam_name = body.qbs_exam_name || body.examName;
    const qbs_exam_added = body.qbs_exam_added || body.examDate || body.formData?.examDate;

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

    // Validate trial user exists (if provided and not null)
    const trial_user_id = body.trial_user_id !== undefined 
      ? (body.trial_user_id === null ? null : Number(body.trial_user_id)) 
      : null;
    
    if (trial_user_id !== null) {
      if (Number.isNaN(trial_user_id)) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: 'trial_user_id must be a number or null',
        });
      }
      const user = await User.findOne({
        where: { ...tenantFilter(req), user_id: trial_user_id },
      });
      if (!user) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: `User not found: ${trial_user_id}`,
        });
      }
    }

    // Normalize patterns array
    const patterns = Array.isArray(body.patterns) ? body.patterns : [];
    const normPatterns = patterns.map(p => ({
      qbs_ptn_id: p && p.qbs_ptn_id ? Number(p.qbs_ptn_id) : undefined,
      qbs_ptn_name: p && p.qbs_ptn_name ? String(p.qbs_ptn_name) : undefined,
      weight: p && p.weight ? Number(p.weight) : 0,
    })).filter(p => p.qbs_ptn_id !== undefined);

    // Normalize questions array
    const questions = Array.isArray(body.questions) ? body.questions : [];
    const normQuestions = questions.map(q => ({
      qbs_qst_id: q && q.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
      qbs_qst_type: q && q.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
      marks: q && q.marks ? Number(q.marks) : 0,
    })).filter(q => q.qbs_qst_id !== undefined);

    // Normalize selectedQueType
    const selectedQueType = Array.isArray(body.selectedQueType) 
      ? body.selectedQueType.map(Number).filter(n => !Number.isNaN(n))
      : [];

    const exam = await Exam.create({
      ...tenantData(req),
      qbs_exam_name,
      qbs_exam_added: qbs_exam_added ? new Date(qbs_exam_added) : new Date(),
      trial_user_id,
      qbs_chapter_id,
      showFields: body.showFields || {},
      formData: body.formData || {},
      headerContent: body.headerContent || '',
      footerContent: body.footerContent || '',
      editorContents: body.editorContents || {},
      selectedQueType,
      patterns: normPatterns,
      questions: normQuestions,
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
    const where = { ...tenantFilter(req) };
    
    // Filter by chapter if provided
    if (req.query.chapterId) {
      where.qbs_chapter_id = Number(req.query.chapterId);
    }
    // Filter by trial user if provided
    if (req.query.trial_user_id) {
      where.trial_user_id = Number(req.query.trial_user_id);
    }

    const exams = await Exam.findAll({
      where,
      attributes: ['qbs_exam_id', 'qbs_exam_name', 'trial_user_id', 'qbs_exam_added'],
      order: [['qbs_exam_id', 'DESC']],
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
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: id,
      },
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'username', 'user_fname'] },
        { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_id', 'qbs_chapter_name'] },
      ],
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    // Convert to plain object so we can modify it
    const examData = exam.toJSON();

    // Safely get question IDs from stored questions array
    const questionIds = (examData.questions || [])
      .map(q => q?.qbs_qst_id)
      .filter(Boolean);

    // If there are question IDs, fetch full question data
    if (questionIds.length) {
      const questions = await Question.findAll({
        where: {
          ...tenantFilter(req),
          qbs_question_id: { [Op.in]: questionIds },
        },
      });
      examData.questions = questions;
    }

    return res.status(HTTPStatus.OK).json(examData);
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

/**
 * GET /api/exams/:id/form
 * Returns a payload suitable for the frontend form builder.
 * Response shape:
 * {
 *   formFields: { qbs_exam_id, qbs_exam_name, qbs_exam_duration, qbs_exam_total_mark, qbs_exam_date, qbs_header_notes, qbs_secondary_notes, foot_notes },
 *   quesTypes: { "1": "Multiple Choice Question", ... }
 * }
 */
export async function getExamFormById(req, res, next) {
  try {
    const id = Number(req.params.id);
    
    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: id,
      },
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    const examData = exam.toJSON();

    // Build formFields using available stored fields (compat with new payload)
    const formFields = {
      qbs_exam_id: examData.qbs_exam_id,
      qbs_exam_name: examData.qbs_exam_name || '',
      qbs_exam_duration: examData.formData?.examDuration || '',
      qbs_exam_total_mark: Number(
        examData.formData?.totalMarks ?? examData.formData?.total_marks ?? 0
      ),
      qbs_exam_date: examData.qbs_exam_added
        ? new Date(examData.qbs_exam_added).toISOString()
        : examData.formData?.examDate || null,
      qbs_header_notes: examData.headerContent || '',
      qbs_secondary_notes: examData.editorContents
        ? JSON.stringify(examData.editorContents)
        : JSON.stringify({}),
      foot_notes: examData.footerContent || '',
    };

    // Determine which question type ids to look up
    const qtypeSet = new Set();
    
    if (Array.isArray(examData.selectedQueType) && examData.selectedQueType.length) {
      examData.selectedQueType.forEach(v => qtypeSet.add(Number(v)));
    }
    
    // Fallback: extract types from questions if present
    if (Array.isArray(examData.questions) && examData.questions.length) {
      examData.questions.forEach(q => {
        if (q?.qbs_qst_type !== undefined && q?.qbs_qst_type !== null) {
          qtypeSet.add(Number(q.qbs_qst_type));
        }
      });
    }

    const qtypeIds = Array.from(qtypeSet).filter(n => !Number.isNaN(n));

    let quesTypes = {};
    if (qtypeIds.length) {
      const types = await QuestionType.findAll({
        where: {
          ...tenantFilter(req),
          qbs_qs_type_id: { [Op.in]: qtypeIds },
        },
        attributes: ['qbs_qs_type_id', 'qbs_qs_type_name'],
      });
      types.forEach(t => {
        quesTypes[String(t.qbs_qs_type_id)] = t.qbs_qs_type_name;
      });
    }

    // If none found, return minimal mapping as sample
    if (!Object.keys(quesTypes).length && examData.selectedQueType?.length) {
      examData.selectedQueType.forEach(id => {
        quesTypes[String(id)] = `type_${id}`;
      });
    }

    return res.status(HTTPStatus.OK).json({ formFields, quesTypes });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/exams/:id/questions
 * Replace all questions in an exam
 */
export async function replaceExamQuestions(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    if (!Array.isArray(body.questions)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({
        message: 'questions array is required in request body',
      });
    }

    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: id,
      },
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    // Normalize questions array
    const normQuestions = body.questions
      .map(q => ({
        qbs_qst_id: q?.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
        qbs_qst_type: q?.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
        marks: q?.marks ? Number(q.marks) : 0,
      }))
      .filter(q => q.qbs_qst_id !== undefined);

    await exam.update({
      questions: normQuestions,
      updated_by: req.user.user_id,
    });

    return res.status(HTTPStatus.OK).json({ message: 'Exam questions replaced', exam });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/exams/:id/questions
 * Remove a question by ID and optionally add new questions
 * Body: { add_question?: [{ qbs_qst_id, qbs_qst_type, marks }], remove_question?: [id1, id2] }
 */
export async function updateExamQuestion(req, res, next) {
  try {
    const examId = Number(req.params.id);
    const { add_question, remove_question } = req.body || {};

    const exam = await Exam.findOne({
      where: {
        ...tenantFilter(req),
        qbs_exam_id: examId,
      },
    });

    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }

    let questions = exam.questions || [];

    // Remove the questions with matching qbs_qst_id
    if (Array.isArray(remove_question) && remove_question.length) {
      const removeIds = remove_question.map(Number);
      questions = questions.filter(q => !removeIds.includes(q.qbs_qst_id));
    }

    // Add new questions if provided
    if (Array.isArray(add_question) && add_question.length) {
      const newQuestions = add_question.map(q => ({
        qbs_qst_id: q?.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
        qbs_qst_type: q?.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
        marks: q?.marks ? Number(q.marks) : 0,
      })).filter(q => q.qbs_qst_id !== undefined);
      
      questions.push(...newQuestions);
    }

    await exam.update({
      questions,
      updated_by: req.user.user_id,
    });

    return res.status(HTTPStatus.OK).json({ message: 'Exam question updated', exam });
  } catch (err) {
    return next(err);
  }
}
