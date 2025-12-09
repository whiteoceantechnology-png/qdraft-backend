import HTTPStatus from 'http-status';
import Exam from '../models/exam.model.js';
import Chapter from '../models/chapter.model.js';
import User from '../models/user.model.js';
import QuestionType from '../models/questionType.model.js';
import Question from '../models/question.model.js';

/** Create an exam */
export async function createExam(req, res, next) {
  try {
  const body = req.body || {};
  // accept both legacy qbs_exam_name and incoming examName
  const qbs_exam_name = body.qbs_exam_name || body.examName;
  const qbs_exam_added = body.qbs_exam_added || body.examDate || body.formData?.examDate;
  const trial_user_id = body.trial_user_id !== undefined ? (body.trial_user_id === null ? null : Number(body.trial_user_id)) : undefined;
  const qbs_chapter_id = body.qbs_chapter_id !== undefined ? Number(body.qbs_chapter_id) : undefined;
  const patterns = Array.isArray(body.patterns) ? body.patterns : [];
  const questions = Array.isArray(body.questions) ? body.questions : [];
  const meta = body.meta || {};
  // new payload fields
  const showFields = body.showFields || {};
  const formData = body.formData || {};
  // const queData = Array.isArray(body.queData) ? body.queData : [];
  const headerContent = body.headerContent || '';
  const footerContent = body.footerContent || '';
  const editorContents = body.editorContents || body.editorContents || {};
  const selectedQueType = Array.isArray(body.selectedQueType) ? body.selectedQueType.map(Number) : (Array.isArray(body.selectedQueType) ? body.selectedQueType : []);

    if (!qbs_exam_name || typeof qbs_exam_name !== 'string') {
      const err = new Error('qbs_exam_name is required and must be a string');
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // optional validation: ensure chapter exists (if provided)
    if (qbs_chapter_id !== undefined && !Number.isNaN(qbs_chapter_id)) {
      const ch = await Chapter.findOne({ qbs_chapter_id }).lean().exec();
      if (!ch) {
        const err = new Error(`Chapter not found: ${qbs_chapter_id}`);
        err.status = HTTPStatus.BAD_REQUEST;
        throw err;
      }
    }

    // optional validation: ensure trial user exists (if provided and not null)
    if (trial_user_id !== undefined && trial_user_id !== null) {
      if (Number.isNaN(trial_user_id)) {
        const err = new Error('trial_user_id must be a number or null');
        err.status = HTTPStatus.BAD_REQUEST;
        throw err;
      }
      const u = await User.findOne({ user_id: trial_user_id }).lean().exec();
      if (!u) {
        const err = new Error(`User not found: ${trial_user_id}`);
        err.status = HTTPStatus.BAD_REQUEST;
        throw err;
      }
    }

    // normalize patterns array
    const normPatterns = patterns.map(p => ({
      qbs_ptn_id: p && p.qbs_ptn_id ? Number(p.qbs_ptn_id) : undefined,
      qbs_ptn_name: p && p.qbs_ptn_name ? String(p.qbs_ptn_name) : undefined,
      weight: p && p.weight ? Number(p.weight) : 0
    })).filter(p => p.qbs_ptn_id !== undefined);

    // normalize questions array
    const normQuestions = questions.map(q => ({
      qbs_qst_id: q && q.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
      qbs_qst_type: q && q.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
      marks: q && q.marks ? Number(q.marks) : 0
    })).filter(q => q.qbs_qst_id !== undefined);

    const exam = new Exam({
      qbs_exam_name,
      qbs_exam_added: qbs_exam_added ? new Date(qbs_exam_added) : undefined,
      trial_user_id: trial_user_id !== undefined ? trial_user_id : null,
      qbs_chapter_id: qbs_chapter_id !== undefined && !Number.isNaN(qbs_chapter_id) ? qbs_chapter_id : undefined,
      patterns: normPatterns,
      questions: normQuestions,
      // new fields
      showFields,
      formData,
      // queData,
      headerContent,
      footerContent,
      editorContents,
      selectedQueType,
      meta,
      created_by: req.user?.user_id || 0,
      updated_by: req.user?.user_id || 0
    });

    const saved = await exam.save();
    return res.status(HTTPStatus.CREATED).json({ message: 'Exam created', exam: saved });
  } catch (err) {
    return next(err);
  }
}

export async function listExams(req, res, next) {
  try {
    const query = {};
    if (req.query.chapterId) query.qbs_chapter_id = Number(req.query.chapterId);
    if (req.query.trial_user_id) query.trial_user_id = Number(req.query.trial_user_id);

    let q = await Exam.find(query).sort({ qbs_exam_id: -1 }).select("qbs_exam_name trial_user_id qbs_exam_id qbs_exam_added").lean().exec();
    return res.status(HTTPStatus.OK).json(q);
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
    
    let exam = await Exam.findOne({ qbs_exam_id: id }).lean().exec();
    
    if (!exam) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    }
    
    // Safely get question IDs
    const questionIds = (exam.questions || []).map(q => q?.qbs_qst_id).filter(Boolean);
    
    if (questionIds.length) {
      const questions = await Question.find({ qbs_question_id: { $in: questionIds } }).select('-_id').lean().exec();
      exam.questions = questions;
    }
    
    return res.status(HTTPStatus.OK).json(exam);
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
    const exam = await Exam.findOne({ qbs_exam_id: id }).lean().exec();
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    // Build formFields using available stored fields (compat with new payload)
    const formFields = {
      qbs_exam_id: exam.qbs_exam_id,
      qbs_exam_name: exam.qbs_exam_name || '',
      qbs_exam_duration: (exam.formData && exam.formData.examDuration) || '',
      qbs_exam_total_mark: Number((exam.formData && (exam.formData.totalMarks || exam.formData.totalMarks === 0 ? exam.formData.totalMarks : exam.formData.total_marks)) || 0),
      qbs_exam_date: exam.qbs_exam_added ? (new Date(exam.qbs_exam_added)).toISOString() : (exam.formData && exam.formData.examDate) || null,
      qbs_header_notes: exam.headerContent || '',
      // keep editor contents as a JSON string to match earlier example
      qbs_secondary_notes: exam.editorContents ? JSON.stringify(exam.editorContents) : JSON.stringify({}),
      foot_notes: exam.footerContent || ''
    };

    // Determine which question type ids to look up.
    const qtypeSet = new Set();
    if (Array.isArray(exam.selectedQueType) && exam.selectedQueType.length) {
      exam.selectedQueType.forEach(v => qtypeSet.add(Number(v)));
    }
    // fallback: extract types from questions if present
    if (Array.isArray(exam.questions) && exam.questions.length) {
      exam.questions.forEach(q => {
        if (q && q.qbs_qst_type !== undefined && q.qbs_qst_type !== null) qtypeSet.add(Number(q.qbs_qst_type));
      });
    }

    const qtypeIds = Array.from(qtypeSet).filter(n => !Number.isNaN(n));

    let quesTypes = {};
    if (qtypeIds.length) {
      const types = await QuestionType.find({ qbs_qs_type_id: { $in: qtypeIds } }).select('qbs_qs_type_id qbs_qs_type_name').lean().exec();
      types.forEach(t => {
        quesTypes[String(t.qbs_qs_type_id)] = t.qbs_qs_type_name;
      });
    }

    // If none found, return minimal mapping for 1 -> 'Multiple Choice Question' as sample
    if (!Object.keys(quesTypes).length && exam.selectedQueType && exam.selectedQueType.length) {
      exam.selectedQueType.forEach(id => { quesTypes[String(id)] = `type_${id}`; });
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

    const update = {};
    if (body.qbs_exam_name) update.qbs_exam_name = body.qbs_exam_name;
    if (body.qbs_exam_added) update.qbs_exam_added = new Date(body.qbs_exam_added);
    if (body.trial_user_id !== undefined) update.trial_user_id = body.trial_user_id === null ? null : Number(body.trial_user_id);
    if (body.qbs_chapter_id !== undefined) update.qbs_chapter_id = Number(body.qbs_chapter_id);
    if (body.patterns) update.patterns = body.patterns;
    if (body.questions) update.questions = body.questions;
    if (body.meta) update.meta = body.meta;
  // allow updating new payload fields
  if (body.showFields) update.showFields = body.showFields;
  if (body.formData) update.formData = body.formData;
  if (body.questions) update.questions = body.questions;
  if (body.headerContent !== undefined) update.headerContent = body.headerContent;
  if (body.footerContent !== undefined) update.footerContent = body.footerContent;
  if (body.editorContents) update.editorContents = body.editorContents;
  if (body.selectedQueType) update.selectedQueType = Array.isArray(body.selectedQueType) ? body.selectedQueType.map(Number) : body.selectedQueType;

    const exam = await Exam.findOneAndUpdate({ qbs_exam_id: id }, update, { new: true, runValidators: true }).exec();
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    return res.status(HTTPStatus.OK).json({ message: 'Exam updated', exam });
  } catch (err) {
    return next(err);
  }
}

export async function deleteExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exam = await Exam.findOneAndDelete({ qbs_exam_id: id }).exec();
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
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
    const normQuestions = body.questions.map(q => ({
      qbs_qst_id: q && q.qbs_qst_id ? Number(q.qbs_qst_id) : undefined,
      qbs_qst_type: q && q.qbs_qst_type ? Number(q.qbs_qst_type) : undefined,
      marks: q && q.marks ? Number(q.marks) : 0
    })).filter(q => q.qbs_qst_id !== undefined);  
    const exam = await Exam.findOneAndUpdate(
      { qbs_exam_id: id },
      { questions: normQuestions },
      { new: true, runValidators: true }
    ).exec();
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });
    return res.status(HTTPStatus.OK).json({ message: 'Exam questions replaced', exam });
  } catch (err) {
    return next(err);
  }
}

/**
 * Remove a question by ID and optionally add a new question
 * PATCH /api/exams/:id/questions
 * Body: { replace_que_id: number, add_question?: { qbs_qst_id, qbs_qst_type, marks } }
 */
export async function updateExamQuestion(req, res, next) {
  try {
    const examId = Number(req.params.id);
    const { add_question, remove_question } = req.body || {};

    const exam = await Exam.findOne({ qbs_exam_id: examId }).exec();
    if (!exam) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Exam not found' });

    // Remove the question with matching qbs_qst_id
    if (remove_question?.length) {
      exam.questions = exam.questions.filter(q => !remove_question.includes(q.qbs_qst_id));
    }
    
    // Add new questions if provided
    if (add_question?.length) {
      exam.questions.push(...add_question);
    }

    exam.updated_by = req.user?.user_id || exam.updated_by;
    await exam.save();
    return res.status(HTTPStatus.OK).json({ message: 'Exam question updated', exam });
  } catch (err) {
    return next(err);
  }
}
