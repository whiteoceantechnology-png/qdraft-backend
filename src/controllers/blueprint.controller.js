/**
 * Blueprint Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import Blueprint from '../models/blueprint.model.js';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';
import QuestionType from '../models/questiontype.model.js';

/**
 * List blueprints
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 20;
    const skip = parseInt(req.query?.skip) * limit || 0;

    const blueprints = await Blueprint.findAll({
      where: { qbs_blp_added_by: req.user.user_id },
      attributes: ['qbs_blp_name', 'qbs_blp_id', 'qbs_blp_added_by'],
      order: [['qbs_blp_id', 'DESC']],
      offset: skip,
      limit: limit
    });

    return res.status(HTTPStatus.OK).json(blueprints);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get blueprint by ID
 */
export async function getById(req, res, next) {
  try {
    const blueprint = await Blueprint.findOne({
      where: { qbs_blp_id: req.params.id }
    });
    
    if (!blueprint) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }
    
    return res.status(HTTPStatus.OK).json(blueprint);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Create blueprint
 */
export async function create(req, res, next) {
  try {
    const body = req.body || {};
    
    const blueprint = await Blueprint.create({
      qbs_blp_name: body.qbs_blp_name,
      qbs_blp_added_by: req.user?.user_id || body.qbs_blp_added_by,
      qbs_blp_dept_id: body.qbs_blp_dept_id,
      qbs_sub_id: body.qbs_sub_id,
      qbs_creative: body.qbs_creative || 0,
      blueprint_marks: body.blueprint_marks || []
    });

    return res.status(HTTPStatus.CREATED).json({ message: 'Blueprint created', blueprint });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Update blueprint
 */
export async function update(req, res, next) {
  try {
    const blueprint = await Blueprint.findOne({
      where: { qbs_blp_id: req.params.id }
    });
    
    if (!blueprint) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }

    const body = req.body || {};
    const updateData = {};
    
    if (body.qbs_blp_name) updateData.qbs_blp_name = body.qbs_blp_name;
    if (body.qbs_blp_dept_id) updateData.qbs_blp_dept_id = body.qbs_blp_dept_id;
    if (body.qbs_sub_id) updateData.qbs_sub_id = body.qbs_sub_id;
    if (body.qbs_creative !== undefined) updateData.qbs_creative = body.qbs_creative;
    if (body.blueprint_marks) updateData.blueprint_marks = body.blueprint_marks;

    await blueprint.update(updateData);
    return res.status(HTTPStatus.OK).json({ message: 'Blueprint updated', blueprint });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Delete blueprint
 */
export async function deleteBlueprint(req, res, next) {
  try {
    const deleted = await Blueprint.destroy({
      where: { qbs_blp_id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Blueprint not found' });
    }
    
    return res.status(HTTPStatus.OK).json({ message: 'Blueprint deleted successfully' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

// Alias for routes compatibility
export const updateBlueprint = update;

/**
 * Get Question Type Counts by Chapters
 */
export async function getQuestionTypeCountsByChapters(req, res, next) {
  try {
    const { qbs_sub_id } = req.query;

    // Get chapters for the subject
    const chapters = await Chapter.findAll({
      where: qbs_sub_id ? { qbs_sub_id } : {},
      attributes: ['qbs_ch_id', 'qbs_ch_name']
    });

    // Get question types
    const questionTypes = await QuestionType.findAll({
      attributes: ['qbs_qt_id', 'qbs_qt_name']
    });

    // Build the result with counts
    const result = await Promise.all(chapters.map(async (chapter) => {
      const typeCounts = await Promise.all(questionTypes.map(async (qt) => {
        const count = await Question.count({
          where: {
            qbs_ch_id: chapter.qbs_ch_id,
            qbs_qt_id: qt.qbs_qt_id
          }
        });
        return {
          qbs_qt_id: qt.qbs_qt_id,
          qbs_qt_name: qt.qbs_qt_name,
          count
        };
      }));

      return {
        qbs_ch_id: chapter.qbs_ch_id,
        qbs_ch_name: chapter.qbs_ch_name,
        questionTypes: typeCounts
      };
    }));

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
