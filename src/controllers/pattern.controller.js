/**
 * Pattern Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import Pattern from '../models/pattern.model.js';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';

/**
 * Create a pattern
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

    // Validate chapter exists
    const chapter = await Chapter.findOne({ where: { qbs_chapter_id } });
    if (!chapter) {
      const err = new Error(`Chapter not found: ${qbs_chapter_id}`);
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // Parse questions array
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

    const pattern = await Pattern.create({
      qbs_ptn_name,
      qbs_chapter_id,
      total_mark: Number(total_mark) || 0,
      sub_notes: sub_notes || {},
      qbs_ptn_questions: parsedQuestions,
      qbs_ptn_added_by: req.user?.user_id || 0
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Pattern created', pattern });
  } catch (err) {
    return next(err);
  }
}

export async function updatePattern(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const body = req.body || {};

    const pattern = await Pattern.findOne({ where: { qbs_ptn_id: id } });
    if (!pattern) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });

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

    await pattern.update(update);
    return res.status(HTTPStatus.OK).json({ message: 'Pattern updated', pattern });
  } catch (err) {
    return next(err);
  }
}

export async function getPattern(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const pattern = await Pattern.findOne({ where: { qbs_ptn_id: id } });
    
    if (!pattern) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    
    const patternData = pattern.toJSON();
    
    if (Array.isArray(patternData.qbs_ptn_questions)) {
      const questionIds = patternData.qbs_ptn_questions.map(q => q.qbs_qst_id);
      if (questionIds.length) {
        const questions = await Question.findAll({
          where: { qbs_question_id: { [Op.in]: questionIds } }
        });
        patternData.questions_details = questions;
      }
    }
    
    return res.status(HTTPStatus.OK).json(patternData);
  } catch (err) {
    return next(err);
  }
}

export async function listPatterns(req, res, next) {
  try {
    const where = {};
    if (req.query.chapterId) where.qbs_chapter_id = Number(req.query.chapterId);
    if (req.query.addedBy) where.qbs_ptn_added_by = Number(req.query.addedBy);

    const patterns = await Pattern.findAll({
      where,
      order: [['qbs_ptn_id', 'DESC']],
      attributes: ['qbs_ptn_id', 'qbs_ptn_name', 'qbs_chapter_id', 'total_mark', 'qbs_ptn_added_at']
    });
    
    return res.status(HTTPStatus.OK).json(patterns);
  } catch (err) {
    return next(err);
  }
}

export async function deletePattern(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const deleted = await Pattern.destroy({ where: { qbs_ptn_id: id } });
    
    if (!deleted) return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Pattern not found' });
    return res.status(HTTPStatus.OK).json({ message: 'Pattern deleted' });
  } catch (err) {
    return next(err);
  }
}

export async function deletePatterns(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'No pattern IDs provided' });
    }
    
    const deleted = await Pattern.destroy({ 
      where: { qbs_ptn_id: ids } 
    });
    
    return res.status(HTTPStatus.OK).json({ message: `${deleted} patterns deleted` });
  } catch (err) {
    return next(err);
  }
}
