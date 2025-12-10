/**
 * Exam Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import Exam from '../models/exam.model.js';
import Chapter from '../models/chapter.model.js';
import User from '../models/user.model.js';
import QuestionType from '../models/questiontype.model.js';
import Question from '../models/question.model.js';

/** Create an exam */
export async function createExam(req, res, next) {
  try {
    const body = req.body || {};
    const qbs_exam_name = body.qbs_exam_name || body.examName;
    const qbs_exam_added = body.qbs_exam_added || body.examDate || body.formData?.examDate;
    const trial_user_id = body.trial_user_id !== undefined ? (body.trial_user_id === null ? null : Number(body.trial_user_id)) : null;
    const qbs_chapter_id = body.qbs_chapter_id !== undefined ? Number(body.qbs_chapter_id) : null;
    const patterns = Array.isArray(body.patterns) ? body.patterns : [];
    const questions = Array.isArray(body.questions) ? body.questions : [];
    const meta = body.meta || {};
    const showFields = body.showFields || {};
    const formData = body.formData || {};
    const headerContent = body.headerContent || '';
    const footerContent = body.footerContent || '';
    const editorContents = body.editorContents || {};
    const selectedQueType = Array.isArray(body.selectedQueType) ? body.selectedQueType.map(Number) : [];

    if (!qbs_exam_name || typeof qbs_exam_name !== 'string') {
      const err = new Error('qbs_exam_name is required and must be a string');
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // Validate chapter exists
    if (qbs_chapter_id && !Number.isNaN(qbs_chapter_id)) {
      const ch = await Chapter.findOne({ where: { qbs_chapter_id } });
      if (!ch) {
        const err = new Error(`Chapter not found: ${qbs_chapter_id}`);
        err.status = HTTPStatus.BAD_REQUEST;
        throw err;
      }
    }

    // Validate trial user exists
    if (trial_user_id !== null) {
      const u = await User.findOne({ where: { user_id: trial_user_id } });
      if (!u) {
        const err = new Error(`User not found: ${trial_user_id}`);
        err.status = HTTPStatus.BAD_REQUEST;
        throw err;
      }
    }

    // Normalize patterns array
    const normPatterns = patterns.map(p => ({
      qbs_ptn_id: p?.qbs_ptn_id ? Number(p.qbs_ptn_id) : undefined,
      qbs_ptn_name: p?.qbs_ptn_name ? String(p.qbs_ptn_name) : undefined,
      weight: p?.weight ? Number(p.weight) : 0
    })).filter(p => p.qbs_ptn_id !== undefined);

    // Normalize questions array
    const normQuestions = questions.map(q => ({
      qbs_qst_id: q?.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
      qbs_qst_type: q?.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
      marks: q?.marks ? Number(q.marks) : 0
    })).filter(q => q.qbs_qst_id !== undefined);

    const exam = await Exam.create({
      qbs_exam_name,
      qbs_exam_added: qbs_exam_added ? new Date(qbs_exam_added) : new Date(),
      trial_user_id,
      qbs_chapter_id: qbs_chapter_id || null,
      patterns: normPatterns,
      questions: normQuestions,
      showFields,
      formData,
      headerContent,
      footerContent,
      editorContents,
      selectedQueType,
      meta,
      created_by: req.user?.user_id || 0,
      updated_by: req.user?.user_id || 0
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Exam created', exam });
  } catch (err) {
    return next(err);
  }
}

export async function listExams(req, res, next) {
  try {
    const where = {};
    if (req.query.chapterId) where.qbs_chapter_id = Number(req.query.chapterId);
    if (req.query.trial_user_id) where.trial_user_id = Number(req.query.trial_user_id);

    const exams = await Exam.findAll({
      where,
      order: [['qbs_exam_id', 'DESC']],
      attributes: ['qbs_exam_name', 'trial_user_id', 'qbs_exam_id', 'qbs_exam_added']
    });
    return res.status(HTTPStatus.OK).json(exams);
  } catch (err) {
    return next(err);
  }
}

export async function getExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Invalid exam ID' });
    }
    
    let exam = await Exam.findOne({ where: { qbs_exam_id: id } });
    
    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }
    
    const examData = exam.toJSON();
    
    // Get full question data
    const questionIds = (examData.questions || []).map(q => q?.qbs_qst_id).filter(Boolean);
    
    if (questionIds.length) {
      const questions = await Question.findAll({
        where: { qbs_question_id: { [Op.in]: questionIds } }
      });
      examData.questions = questions;
    }
    
    return res.status(HTTPStatus.OK).json(examData);
  } catch (err) {
    return next(err);
  }
}

export async function getExamFormById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exam = await Exam.findOne({ where: { qbs_exam_id: id } });
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    const examData = exam.toJSON();

    const formFields = {
      qbs_exam_id: examData.qbs_exam_id,
      qbs_exam_name: examData.qbs_exam_name || '',
      qbs_exam_duration: examData.formData?.examDuration || '',
      qbs_exam_total_mark: Number(examData.formData?.totalMarks || examData.formData?.total_marks || 0),
      qbs_exam_date: examData.qbs_exam_added ? new Date(examData.qbs_exam_added).toISOString() : (examData.formData?.examDate || null),
      qbs_header_notes: examData.headerContent || '',
      qbs_secondary_notes: examData.editorContents ? JSON.stringify(examData.editorContents) : '{}',
      foot_notes: examData.footerContent || ''
    };

    // Get question type IDs
    const qtypeSet = new Set();
    if (Array.isArray(examData.selectedQueType)) {
      examData.selectedQueType.forEach(v => qtypeSet.add(Number(v)));
    }
    if (Array.isArray(examData.questions)) {
      examData.questions.forEach(q => {
        if (q?.qbs_qst_type != null) qtypeSet.add(Number(q.qbs_qst_type));
      });
    }

    const qtypeIds = Array.from(qtypeSet).filter(n => !Number.isNaN(n));

    let quesTypes = {};
    if (qtypeIds.length) {
      const types = await QuestionType.findAll({
        where: { qbs_qs_type_id: { [Op.in]: qtypeIds } },
        attributes: ['qbs_qs_type_id', 'qbs_qs_type_name']
      });
      types.forEach(t => {
        quesTypes[String(t.qbs_qs_type_id)] = t.qbs_qs_type_name;
      });
    }

    if (!Object.keys(quesTypes).length && examData.selectedQueType?.length) {
      examData.selectedQueType.forEach(id => { quesTypes[String(id)] = `type_${id}`; });
    }

    return res.status(HTTPStatus.OK).json({ formFields, quesTypes });
  } catch (err) {
    return next(err);
  }
}

export async function updateExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const exam = await Exam.findOne({ where: { qbs_exam_id: id } });
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    const update = {};
    if (body.qbs_exam_name) update.qbs_exam_name = body.qbs_exam_name;
    if (body.qbs_exam_added) update.qbs_exam_added = new Date(body.qbs_exam_added);
    if (body.trial_user_id !== undefined) update.trial_user_id = body.trial_user_id === null ? null : Number(body.trial_user_id);
    if (body.qbs_chapter_id !== undefined) update.qbs_chapter_id = Number(body.qbs_chapter_id);
    if (body.patterns) update.patterns = body.patterns;
    if (body.questions) update.questions = body.questions;
    if (body.meta) update.meta = body.meta;
    if (body.showFields) update.showFields = body.showFields;
    if (body.formData) update.formData = body.formData;
    if (body.headerContent !== undefined) update.headerContent = body.headerContent;
    if (body.footerContent !== undefined) update.footerContent = body.footerContent;
    if (body.editorContents) update.editorContents = body.editorContents;
    if (body.selectedQueType) update.selectedQueType = Array.isArray(body.selectedQueType) ? body.selectedQueType.map(Number) : body.selectedQueType;

    await exam.update(update);
    return res.status(HTTPStatus.OK).json({ message: 'Exam updated', exam });
  } catch (err) {
    return next(err);
  }
}

export async function deleteExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await Exam.destroy({ where: { qbs_exam_id: id } });
    if (!deleted) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    return res.status(HTTPStatus.OK).json({ message: 'Exam deleted' });
  } catch (err) {
    return next(err);
  }
}

export async function replaceExamQuestions(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    
    if (!Array.isArray(body.questions)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'questions array is required in request body' });
    }
    
    const exam = await Exam.findOne({ where: { qbs_exam_id: id } });
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    const normQuestions = body.questions.map(q => ({
      qbs_qst_id: q?.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
      qbs_qst_type: q?.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
      marks: q?.marks ? Number(q.marks) : 0
    })).filter(q => q.qbs_qst_id !== undefined);

    await exam.update({ questions: normQuestions });
    return res.status(HTTPStatus.OK).json({ message: 'Exam questions replaced', exam });
  } catch (err) {
    return next(err);
  }
}

export async function updateExamQuestion(req, res, next) {
  try {
    const examId = Number(req.params.id);
    const { add_question, remove_question } = req.body || {};

    const exam = await Exam.findOne({ where: { qbs_exam_id: examId } });
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    let questions = exam.questions || [];

    // Remove questions
    if (remove_question?.length) {
      questions = questions.filter(q => !remove_question.includes(q.qbs_qst_id));
    }
    
    // Add new questions
    if (add_question?.length) {
      questions.push(...add_question);
    }

    await exam.update({
      questions,
      updated_by: req.user?.user_id || exam.updated_by
    });

    return res.status(HTTPStatus.OK).json({ message: 'Exam question updated', exam });
  } catch (err) {
    return next(err);
  }
}
