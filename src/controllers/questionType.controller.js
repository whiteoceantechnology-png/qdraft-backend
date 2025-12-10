/**
 * QuestionType Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import QuestionType from '../models/questiontype.model.js';
import Question from '../models/question.model.js';

export async function createQuestionType(req, res, next) {
  try {
    const questionType = await QuestionType.create({
      qbs_qs_type_name: req.body.qbs_qs_type_name,
      name: req.body.name,
      marks: req.body.marks,
      subject_id: req.body.subject_id
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Question type created successfully',
      questionType
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionTypes(req, res, next) {
  try {
    const where = {};
    if (req.user?.subject_id) {
      where.subject_id = req.user.subject_id;
    }
    
    const questionTypes = await QuestionType.findAll({
      where,
      order: [['qbs_qs_type_id', 'ASC']]
    });

    return res.status(HTTPStatus.OK).json(questionTypes);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionTypeById(req, res, next) {
  try {
    const questionType = await QuestionType.findOne({
      where: { qbs_qs_type_id: parseInt(req.params.id) }
    });

    if (!questionType) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    return res.status(HTTPStatus.OK).json(questionType);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionTypesByChapterId(req, res, next) {
  try {
    const chapterId = Number(req.params.id);
    
    const questionTypes = await QuestionType.findAll({
      order: [['qbs_qs_type_id', 'ASC']]
    });
    
    const typesWithCounts = await Promise.all(
      questionTypes.map(async (type) => {
        const questionCount = await Question.count({
          where: {
            qbs_chapter_id: chapterId,
            qbs_qst_type_id: type.qbs_qs_type_id
          }
        });
        
        return {
          qbs_qs_type_id: type.qbs_qs_type_id,
          qbs_qs_type_name: type.qbs_qs_type_name,
          name: type.name,
          marks: type.marks,
          subject_id: type.subject_id,
          question_count: questionCount
        };
      })
    );

    return res.status(HTTPStatus.OK).json(typesWithCounts);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestionType(req, res, next) {
  try {
    const questionType = await QuestionType.findOne({
      where: { qbs_qs_type_id: req.params.id }
    });

    if (!questionType) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    await questionType.update({
      qbs_qs_type_name: req.body.qbs_qs_type_name,
      name: req.body.name,
      marks: req.body.marks,
      subject_id: req.body.subject_id
    });

    return res.status(HTTPStatus.OK).json({
      message: 'Question type updated successfully',
      questionType
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestionType(req, res, next) {
  try {
    const deleted = await QuestionType.destroy({
      where: { qbs_qs_type_id: req.params.id }
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'Question type not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Question type deleted successfully' });
  } catch (error) {
    next(error);
  }
}
