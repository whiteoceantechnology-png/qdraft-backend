/**
 * Blueprint Controller
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import contants from '../config/constants.js';

import { filteredBody } from '../utils/filteredBody.js';
import Blueprint from '../models/blueprint.model.js';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';
import QuestionType from '../models/questionType.model.js';
import User from '../models/user.model.js';

export const validation = {
  create: {
    body: {
      title: Joi.string()
        .min(3)
        .required(),
      text: Joi.string().required(),
    },
  },
  update: {
    body: {
      title: Joi.string().min(3),
      text: Joi.string(),
    },
  },
};

/**
 * @api {get} /Blueprints Get Blueprints
 * @apiDescription Get a list of Blueprints
 * @apiName getListOfBlueprint
 * @apiGroup Blueprint
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam (query) {Int} skip Number of skip Blueprints
 * @apiParam (query) {Int} limit Maximum number of Blueprints
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object[]} Blueprint Blueprint list.
 * @apiSuccess {String} Blueprint._id Blueprint _id.
 * @apiSuccess {String} Blueprint.title Blueprint title.
 * @apiSuccess {String} Blueprint.text Blueprint text.
 * @apiSuccess {Object} Blueprint.author Blueprint author.
 * @apiSuccess {String} Blueprint.author._id Blueprint author _id.
 * @apiSuccess {String} Blueprint.author.username Blueprint author username.
 * @apiSuccess {String} Blueprint.createdAt Blueprint created date.
 *
 *
 * @apiParam (Login) {String} pass Only logged in users can do this.
 *
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "AUTHORIZATION": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTBhMWI3ODAzMDI3N2NiNjQxM2JhZGUiLCJpYXQiOjE0OTM4MzQ2MTZ9.RSlMF6RRwAALZQRdfKrOZWnuHBk-mQNnRcCLJsc8zio"
 * }
 *
 * @apiSuccessExample Success-Response:
 *
 * HTTP/1.1 200 OK
 *
 * [
 *  {
 *    _id: '123',
 *    title: 'New title 1',
 *    text: 'New text 1',
 *    createdAt: '2017-05-03',
 *    author: {
 *      _id: '123312',
 *      username: 'Jon'
 *    }
 *  },
 *  {
 *    _id: '12234',
 *    title: 'New title 2',
 *    text: 'New text 2',
 *    createdAt: '2017-05-03',
 *    author: {
 *      _id: '123312234',
 *      username: 'Jon'
 *    }
 *  }
 * ]
 *
 * @apiErrorExample {json} Blueprint not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 20;
    const skip = parseInt(req.query?.skip) * limit || 0;

    const list = await Blueprint.find({ qbs_blp_added_by: req.user.user_id }, { qbs_blp_name: 1, qbs_blp_id: 1, qbs_blp_added_by: 1, _id: 0 })
      .sort({ qbs_blp_id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return res.status(HTTPStatus.OK).json(list);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {get} /Blueprints/:id Get a single Blueprint
 * @apiDescription Get a single Blueprint
 * @apiName getBlueprint
 * @apiGroup Blueprint
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Blueprint Blueprint created.
 * @apiSuccess {String} Blueprint._id Blueprint _id.
 * @apiSuccess {String} Blueprint.title Blueprint title.
 * @apiSuccess {String} Blueprint.text Blueprint text.
 * @apiSuccess {Object} Blueprint.author Blueprint author.
 * @apiSuccess {String} Blueprint.author._id Author id.
 * @apiSuccess {String} Blueprint.author.username Author username.
 * @apiSuccess {String} Blueprint.createdAt Blueprint created date.
 * @apiSuccess {Boolean} favorite User have favorite Blueprint
 *
 * @apiParam (Login) {String} pass Only logged in users can do this.
 *
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "AUTHORIZATION": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTBhMWI3ODAzMDI3N2NiNjQxM2JhZGUiLCJpYXQiOjE0OTM4MzQ2MTZ9.RSlMF6RRwAALZQRdfKrOZWnuHBk-mQNnRcCLJsc8zio"
 * }
 *
 * @apiSuccessExample Success-Response:
 *
 * HTTP/1.1 200 OK
 *
 * @apiErrorExample {json} Blueprint not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function getById(req, res, next) {
  try {
    const Blueprints = await Blueprint.findOne({ qbs_blp_id: req.params.id });
    return res.status(HTTPStatus.OK).json(Blueprints);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {Blueprint} /Blueprints Create a Blueprint
 * @apiDescription Create a Blueprint
 * @apiName createBlueprint
 * @apiGroup Blueprint
 *
 * @apiParam (Body) {String} title Blueprint title.
 * @apiParam (Body) {String} text Blueprint text.
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Blueprint Blueprint created.
 * @apiSuccess {String} Blueprint._id Blueprint _id.
 * @apiSuccess {String} Blueprint.title Blueprint title.
 * @apiSuccess {String} Blueprint.text Blueprint text.
 * @apiSuccess {String} Blueprint.author Blueprint author id.
 * @apiSuccess {String} Blueprint.createdAt Blueprint created date.
 *
 * @apiParam (Login) {String} pass Only logged in users can do this.
 *
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "AUTHORIZATION": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTBhMWI3ODAzMDI3N2NiNjQxM2JhZGUiLCJpYXQiOjE0OTM4MzQ2MTZ9.RSlMF6RRwAALZQRdfKrOZWnuHBk-mQNnRcCLJsc8zio"
 * }
 *
 * @apiSuccessExample Success-Response:
 *
 * HTTP/1.1 200 OK
 *
 * {
 *  _id: '123',
 *  title: 'a title',
 *  text: 'a text',
 *  createdAt: '2017-05-03',
 *  author: '123312'
 * }
 *
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
/* export async function create(req, res, next) {
  try {
    const savedData =  await Blueprint.create(req.body.sendData, req.user._id)
    return res
      .status(HTTPStatus.CREATED)
      .json(savedData);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
} */

/**
 * @api {delete} /Blueprints/:id Delete a Blueprint
 * @apiDescription Delete a Blueprint if the author it's the right one
 * @apiName deleteBlueprint
 * @apiGroup Blueprint
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Blueprint unique ID.
 *
 * @apiParam (Login) {String} pass Only logged in users can do this.
 *
 * @apiSuccess {Number} status Status of the Request.
 *
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "AUTHORIZATION": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTBhMWI3ODAzMDI3N2NiNjQxM2JhZGUiLCJpYXQiOjE0OTM4MzQ2MTZ9.RSlMF6RRwAALZQRdfKrOZWnuHBk-mQNnRcCLJsc8zio"
 * }
 *
 * @apiSuccessExample Success-Response:
 *
 * HTTP/1.1 200 OK
 *
 * 200
 *
 * @apiErrorExample {json} Blueprint not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 *
 */
export async function deleteBlueprint(req, res, next) {
  try {
    // Delete multiple blueprints by ids, ensuring user owns them
    const blueprint = await Blueprint.deleteOne({
      $and: [
        { qbs_blp_id: req.params.id },
        { qbs_blp_added_by: req.user.user_id }
      ]
    });

    if (blueprint.deletedCount === 0) {
      return res.status(HTTPStatus.NOT_FOUND).json({ 
        message: 'Blueprint not found or not authorized to delete' 
      });
    }

    return res.status(HTTPStatus.OK).json({ message: 'Blueprint deleted' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {patch} /Blueprints/:id Update a Blueprint
 * @apiDescription Update a Blueprint if the author it's the right one
 * @apiName updateBlueprint
 * @apiGroup Blueprint
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Blueprint unique ID.
 *
 * @apiParam (Body) {String} [title] Blueprint title.
 * @apiParam (Body) {String} [text] Blueprint text.
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Blueprint Blueprint updated.
 * @apiSuccess {String} Blueprint._id Blueprint _id.
 * @apiSuccess {String} Blueprint.title Blueprint title.
 *
 * @apiParam (Login) {String} pass Only logged in users can do this.
 *
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "AUTHORIZATION": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTBhMWI3ODAzMDI3N2NiNjQxM2JhZGUiLCJpYXQiOjE0OTM4MzQ2MTZ9.RSlMF6RRwAALZQRdfKrOZWnuHBk-mQNnRcCLJsc8zio"
 * }
 *
 * @apiSuccessExample Success-Response:
 *
 * HTTP/1.1 200 OK
 *
 * @apiErrorExample {json} Blueprint not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function updateBlueprint(req, res, next) {
  // const body = filteredBody(req.body, contants.WHITELIST.Blueprints.update);
  try {
    const Data = await Blueprint.findOne({ qbs_blp_id: req.params.id });

    if (Data.qbs_blp_added_by !== req.user.user_id) {
      return res.status(HTTPStatus.OK).json({ message: 'Not found', status: true });
    }

    Object.keys(req.body).forEach(key => {
      Data[key] = req.body[key];
      if (key === 'transformedPayload') {
        Data['blueprint_marks'].map(bmark => {
          bmark.qbs_generic_marks = req.body.transformedPayload[bmark.qbs_blp_chapter_id]
        })
      }
    });

    return res.status(HTTPStatus.OK).json(await Data.save());
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Create blueprint from payload:
 * {
 *   qbs_blp_name: 'testdemo',
 *   transformedPayload: {
 *     "3976": { "1": { "1": "2" } }, ...
 *   },
 *   qbs_blp_dept_id?: Number,
 *   qbs_sub_id?: Number,
 *   qbs_blp_added_by?: Number
 * }
 */
export async function create(req, res, next) {
  try {
    const { qbs_blp_name, transformedPayload } = req.body;
    console.log('Creating blueprint:', req.user
    );

    if (!qbs_blp_name || !transformedPayload || typeof transformedPayload !== 'object') {
      const err = new Error('qbs_blp_name and transformedPayload are required');
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // determine next qbs_blp_id
    const lastBlp = await Blueprint.findOne().sort({ qbs_blp_id: -1 }).select('qbs_blp_id').lean().exec();
    const nextBlpId = lastBlp && lastBlp.qbs_blp_id ? lastBlp.qbs_blp_id + 1 : 1;

    // validate chapter ids from payload using Chapter ref
    const chapterIds = Object.keys(transformedPayload)
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id));

    const existingChapters = await Chapter.find({ qbs_chapter_id: { $in: chapterIds } }).select('qbs_chapter_id').lean().exec();
    const existingSet = new Set(existingChapters.map(c => c.qbs_chapter_id));

    // if you want to reject when some chapters are missing, uncomment below:
    const missing = chapterIds.filter(id => !existingSet.has(id));
    if (missing.length) {
      const err = new Error(`Chapters not found: ${missing.join(', ')}`);
      err.status = HTTPStatus.BAD_REQUEST;
      throw err;
    }

    // determine starting qbs_bmark_id (max existing + 1)
    const agg = await Blueprint.aggregate([
      { $unwind: { path: '$blueprint_marks', preserveNullAndEmptyArrays: false } },
      { $group: { _id: null, maxBmark: { $max: '$blueprint_marks.qbs_bmark_id' } } }
    ]).exec();

    let nextBmarkId = (agg && agg.length && agg[0].maxBmark) ? agg[0].maxBmark + 1 : 1;

    // build blueprint_marks array from transformedPayload
    const blueprintMarks = [];
    for (const [chapterIdStr, genericObj] of Object.entries(transformedPayload)) {
      const qbs_blp_chapter_id = Number(chapterIdStr);
      if (Number.isNaN(qbs_blp_chapter_id)) continue;
      if (!existingSet.has(qbs_blp_chapter_id)) continue; // extra safety

      blueprintMarks.push({
        qbs_bmark_id: nextBmarkId++,
        qbs_blp_chapter_id,
        qbs_blp_mark: null,
        qbs_generic_marks: genericObj
      });
    }

    const blueprintDoc = new Blueprint({
      qbs_blp_id: nextBlpId,
      qbs_blp_name,
      qbs_blp_dept_id: req.user.dept_id || null,
      qbs_sub_id: req.user.subject_id || null,
      qbs_blp_added_by: req.user.user_id || 0,
      qbs_creative: req.body.qbs_creative || 0,
      blueprint_marks: blueprintMarks
    });

    const saved = await blueprintDoc.save();

    return res.status(HTTPStatus.CREATED).json({
      message: 'Blueprint created',
      blueprint: saved
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/blueprints/stats
 * Body: { chapterIds?: [3976,3977,...] }
 * Returns object shaped like the sample in the prompt:
 * {
 *   resultCounts: { "<chapter name>": { chapter_id, questions: [ { questiontype, questiontypeid, creative_count, not_creative_count }, ... ] } },
 *   questionTypes: [ { qbs_qs_type_id, qbs_qs_type_name, marks }, ... ]
 * }
 */
export async function getQuestionTypeCountsByChapters(req, res, next) {
  try {
    const bodyIds = Array.isArray(req.body?.chapterIds) ? req.body.chapterIds.map(Number) : null;

    // fetch question types once
    const questionTypes = await QuestionType.find({})
      .select('qbs_qs_type_id qbs_qs_type_name marks')
      .lean()
      .exec();

    // build match for pipeline
    const match = {};
    if (bodyIds && bodyIds.length) match.qbs_lesson_id = { $in: bodyIds };

    // aggregate counts per chapter + question type
    const agg = await Question.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            lesson: '$qbs_lesson_id',
            qtype: '$qbs_question_type'
          },
          creative_count: {
            $sum: {
              $cond: [{ $eq: ['$qbs_creative', 1] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          lesson: '$_id.lesson',
          qtype: '$_id.qtype',
          creative_count: 1,
          not_creative_count: { $subtract: ['$total', '$creative_count'] },
          _id: 0
        }
      }
    ]).exec();

    // get chapters involved (either requested or from aggregation)
    const chapterIds = bodyIds && bodyIds.length
      ? bodyIds
      : Array.from(new Set(agg.map(a => a.lesson)));

    const chapters = await Chapter.find({ qbs_chapter_id: { $in: chapterIds } })
      .select('qbs_chapter_id qbs_chapter_name')
      .lean()
      .exec();

    const chapterNameById = new Map(chapters.map(c => [c.qbs_chapter_id, c.qbs_chapter_name || `chapter_${c.qbs_chapter_id}`]));

    // map question types by id for name/marks
    const qtypeById = new Map(questionTypes.map(t => [t.qbs_qs_type_id, t]));

    // build resultCounts keyed by chapter name
    const resultCounts = {};

    // initialize chapters which exist in chapters list (keeps order deterministic)
    for (const ch of chapters) {
      resultCounts[ch.qbs_chapter_name || `chapter_${ch.qbs_chapter_id}`] = {
        chapter_id: ch.qbs_chapter_id,
        questions: []
      };
    }

    // fill counts from aggregation; include all question types even if count 0 (optional)
    for (const row of agg) {
      const chapterName = chapterNameById.get(row.lesson) || `chapter_${row.lesson}`;
      const typeInfo = qtypeById.get(row.qtype) || { qbs_qs_type_id: row.qtype, qbs_qs_type_name: `type_${row.qtype}`, marks: 0 };

      if (!resultCounts[chapterName]) {
        resultCounts[chapterName] = {
          chapter_id: row.lesson,
          questions: []
        };
      }

      resultCounts[chapterName].questions.push({
        questiontype: typeInfo.qbs_qs_type_name,
        questiontypeid: typeInfo.qbs_qs_type_id,
        creative_count: row.creative_count,
        not_creative_count: row.not_creative_count
      });
    }

    // Optionally ensure every question type appears under each chapter with zero counts.
    // If desired, uncomment the block below to pad zeros.
    /*
    for (const [chapterName, data] of Object.entries(resultCounts)) {
      const existingTypes = new Set(data.questions.map(q => q.questiontypeid));
      for (const qt of questionTypes) {
        if (!existingTypes.has(qt.qbs_qs_type_id)) {
          data.questions.push({
            questiontype: qt.qbs_qs_type_name,
            questiontypeid: qt.qbs_qs_type_id,
            creative_count: 0,
            not_creative_count: 0
          });
        }
      }
      data.questions.sort((a,b) => a.questiontypeid - b.questiontypeid);
    }
    */

    return res.status(HTTPStatus.OK).json({
      resultCounts,
      questionTypes: questionTypes.map(t => ({
        qbs_qs_type_id: t.qbs_qs_type_id,
        qbs_qs_type_name: t.qbs_qs_type_name,
        marks: t.marks
      }))
    });
  } catch (err) {
    return next(err);
  }
}
