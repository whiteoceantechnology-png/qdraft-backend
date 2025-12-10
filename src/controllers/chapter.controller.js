/**
 * Chapter Controller - Sequelize for MariaDB
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import { Op, fn, col } from 'sequelize';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';

export const validation = {
  create: {
    body: {
      qbs_chapter_name: Joi.string().min(3).required(),
      qbs_dept_id: Joi.number().required(),
      qbs_sub_id: Joi.number().required(),
    },
  },
  update: {
    body: {
      qbs_chapter_name: Joi.string().min(3),
    },
  },
};

/**
 * Get list of chapters with question counts
 */
export async function getList(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 20;
    const skip = parseInt(req.query?.skip) * limit || 0;
    
    const chapters = await Chapter.findAll({
      offset: skip,
      limit: limit,
      order: [['qbs_chapter_id', 'ASC']]
    });
    
    // Get question counts for each chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const questionCount = await Question.count({ 
          where: { qbs_chapter_id: chapter.qbs_chapter_id }
        });
        
        return {
          qbs_chapter_id: chapter.qbs_chapter_id,
          qbs_chapter_name: chapter.qbs_chapter_name,
          qbs_dept_id: chapter.qbs_dept_id,
          qbs_sub_id: chapter.qbs_sub_id,
          question_count: questionCount
        };
      })
    );

    return res.status(HTTPStatus.OK).json(chaptersWithCounts);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get chapter by ID
 */
export async function getById(req, res, next) {
  try {
    const chapter = await Chapter.findOne({
      where: { qbs_chapter_id: req.params.id }
    });
    
    if (!chapter) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }
    
    return res.status(HTTPStatus.OK).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Create a chapter
 */
export async function create(req, res, next) {
  try {
    const chapter = await Chapter.create({
      qbs_chapter_name: req.body.qbs_chapter_name,
      qbs_dept_id: req.body.qbs_dept_id,
      qbs_sub_id: req.body.qbs_sub_id
    });
    
    return res.status(HTTPStatus.CREATED).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Update a chapter
 */
export async function update(req, res, next) {
  try {
    const chapter = await Chapter.findOne({
      where: { qbs_chapter_id: req.params.id }
    });
    
    if (!chapter) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }
    
    await chapter.update({
      qbs_chapter_name: req.body.qbs_chapter_name || chapter.qbs_chapter_name,
      qbs_dept_id: req.body.qbs_dept_id || chapter.qbs_dept_id,
      qbs_sub_id: req.body.qbs_sub_id || chapter.qbs_sub_id
    });
    
    return res.status(HTTPStatus.OK).json(chapter);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Delete a chapter
 */
export async function deleteChapter(req, res, next) {
  try {
    const deleted = await Chapter.destroy({
      where: { qbs_chapter_id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Chapter not found' });
    }
    
    return res.status(HTTPStatus.OK).json({ message: 'Chapter deleted successfully' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get chapters by subject ID
 */
export async function getBySubjectId(req, res, next) {
  try {
    const chapters = await Chapter.findAll({
      where: { qbs_sub_id: req.params.subjectId },
      order: [['qbs_chapter_name', 'ASC']]
    });
    
    return res.status(HTTPStatus.OK).json(chapters);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get chapters with pattern counts
 */
export async function getChaptersWithPatternCounts(req, res, next) {
  try {
    const chapters = await Chapter.findAll({
      order: [['qbs_chapter_name', 'ASC']]
    });
    
    // Import Pattern model dynamically to avoid circular deps
    const Pattern = (await import('../models/pattern.model.js')).default;
    
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const patternCount = await Pattern.count({
          where: { qbs_ch_id: chapter.qbs_chapter_id }
        });
        
        return {
          ...chapter.toJSON(),
          pattern_count: patternCount
        };
      })
    );
    
    return res.status(HTTPStatus.OK).json(chaptersWithCounts);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get chapters by subject and department
 */
export async function getChaptersBySubjectAndDept(req, res, next) {
  try {
    const { subId, deptId } = req.params;
    
    const chapters = await Chapter.findAll({
      where: {
        qbs_sub_id: subId,
        qbs_dept_id: deptId
      },
      order: [['qbs_chapter_name', 'ASC']]
    });
    
    return res.status(HTTPStatus.OK).json(chapters);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
