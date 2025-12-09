import HTTPStatus from 'http-status';
import Pattern from '../models/pattern.model.js';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';

/**
 * Create a pattern (blueprint-like question selection)
 * Expected body shape:
 * {
 *   sub_notes: { "1": ["Multiple Choice Question","1 x 1 = 1"], ... },
 *   qbs_ptn_name: 'demo',
 *   qbs_chapter_id: 3976,
 *   total_mark: 14,
 *   qbs_ptn_questions: ["420815, 1", "314047, 6", ...]
 * }
 */
export async function createPattern(req, res, next) {
  try {
    const body = req.body || {};
    const { sub_notes, qbs_ptn_name, qbs_chapter_id, total_mark, qbs_ptn_questions } = body;

    if (!qbs_ptn_name || !qbs_chapter_id) {
      const err = new Error('qbs_ptn_name and qbs_chapter_id are required');
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // validate chapter exists
    const chapter = await Chapter.findOne({ qbs_chapter_id }).lean().exec();
    if (!chapter) {
      const err = new Error(`Chapter not found: ${qbs_chapter_id}`);
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // parse questions array
    const parsedQuestions = (Array.isArray(qbs_ptn_questions) ? qbs_ptn_questions : []).map(item => {
      if (typeof item === 'string') {
        const parts = item.split(',').map(s => s.trim());
        return { qbs_qst_id: parseInt(parts[0]), qbs_qst_type: parseInt(parts[1]) };
      }
      if (typeof item === 'object' && item !== null) {
        return { qbs_qst_id: Number(item.qbs_qst_id), qbs_qst_type: Number(item.qbs_qst_type) };
      }
      return null;
    }).filter(Boolean);

    const pattern = new Pattern({
      qbs_ptn_name,
      qbs_chapter_id,
      total_mark: Number(total_mark) || 0,
      sub_notes: sub_notes || {},
      qbs_ptn_questions: parsedQuestions,
      qbs_ptn_added_by: req.user?.user_id || 0
    });

    const saved = await pattern.save();
    return res.status(HTTPStatus.CREATED).json({ message: 'Pattern created', pattern: saved });
  } catch (err) {
    return next(err);
  }
}

export async function updatePattern(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const body = req.body || {};

    const update = {};
    if (body.qbs_ptn_name) update.qbs_ptn_name = body.qbs_ptn_name;
    if (body.qbs_chapter_id) update.qbs_chapter_id = body.qbs_chapter_id;
    if (body.total_mark !== undefined) update.total_mark = Number(body.total_mark);
    if (body.sub_notes) update.sub_notes = body.sub_notes;
    if (Array.isArray(body.qbs_ptn_questions)) {
      update.qbs_ptn_questions = body.qbs_ptn_questions.map(item => {
        if (typeof item === 'string') {
          const parts = item.split(',').map(s => s.trim());
          return { qbs_qst_id: parseInt(parts[0]), qbs_qst_type: parseInt(parts[1]) };
        }
        if (typeof item === 'object' && item !== null) {
          return { qbs_qst_id: Number(item.qbs_qst_id), qbs_qst_type: Number(item.qbs_qst_type) };
        }
        return null;
      }).filter(Boolean);
    }

    const pattern = await Pattern.findOneAndUpdate({ qbs_ptn_id: id }, update, { new: true, runValidators: true }).exec();
    if (!pattern) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    return res.status(HTTPStatus.OK).json({ message: 'Pattern updated', pattern });
  } catch (err) {
    return next(err);
  }
}

export async function getPattern(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const pattern = await Pattern.findOne({ qbs_ptn_id: id }).lean().exec();
    if (pattern && Array.isArray(pattern.qbs_ptn_questions)) {
      const questionIds = pattern.qbs_ptn_questions.map(q => q.qbs_qst_id);
      console.log('Fetching questions for IDs:', questionIds);
      const questions = await Question.find({ qbs_question_id: { $in: questionIds } }).select('-_id').lean().exec();
      console.log('Fetched questions:', questions.length);
      pattern.qbs_ptn_questions = pattern.qbs_ptn_questions.map(q => ({
        ...q,
        ...(questions.find(question => question.qbs_question_id === q.qbs_qst_id)) || null
      }));
    }
    if (!pattern) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    return res.status(HTTPStatus.OK).json(pattern);
  } catch (err) {
    return next(err);
  }
}

export async function listPatterns(req, res, next) {
  try {
    const query = {};
    if (req.query.chapterId) query.qbs_chapter_id = parseInt(req.query.chapterId);
    const list = await Pattern.find(query).sort({ qbs_ptn_id: -1 }).select({ sub_notes: 0 }).lean().exec();
    return res.status(HTTPStatus.OK).json(list);
  } catch (err) {
    return next(err);
  }
}

export async function deletePatterns(req, res, next) {
  try {
    // Delete multiple patterns by ids
    const result = await Pattern.deleteMany({
      $and: [
        { qbs_ptn_id: { $in: req.body.ids } },
        // Optionally, you can add ownership check here if needed 
        { qbs_ptn_added_by: req.user.user_id }
      ]
    });
    return res.status(HTTPStatus.OK).json({ message: 'Patterns deleted', deletedCount: result.deletedCount });
  } catch (err) {
    return next(err);
  }
}
