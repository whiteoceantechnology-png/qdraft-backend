/**
 * Chapter Controller
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import contants from '../config/constants.js';

import { filteredBody } from '../utils/filteredBody.js';
import Chapter from '../models/chapter.model.js';
import Question from '../models/question.model.js';

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
 * @api {get} /Chapters Get Chapters
 * @apiDescription Get a list of Chapters
 * @apiName getListOfChapters
 * @apiGroup Chapter
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam (query) {Int} skip Number of skip Chapters
 * @apiParam (query) {Int} limit Maximum number of Chapters
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object[]} Chapter Chapter list.
 * @apiSuccess {String} Chapter._id Chapter _id.
 * @apiSuccess {String} Chapter.title Chapter title.
 * @apiSuccess {String} Chapter.text Chapter text.
 * @apiSuccess {Object} Chapter.author Chapter author.
 * @apiSuccess {String} Chapter.author._id Chapter author _id.
 * @apiSuccess {String} Chapter.author.username Chapter author username.
 * @apiSuccess {String} Chapter.createdAt Chapter created date.
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
  [
    {
        "qbs_chapter_id": 3976,
        "qbs_chapter_name": "Applications of Matrices and Determinants",
        "qbs_sub_id": 5,
        "qbs_dept_id": 4,
        "question_count": 0
    },
    {
        "qbs_chapter_id": 3977,
        "qbs_chapter_name": "Complex Numbers",
        "qbs_sub_id": 5,
        "qbs_dept_id": 4,
        "question_count": 1
    }
  ]
 *
 * @apiErrorExample {json} Chapter not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function getList(req, res, next) {
  try {
    const limit = parseInt(req.query?.limit) || 20;
    const skip = parseInt(req.query?.skip)*limit || 0;
    
    // Get chapters
    const chapters = await Chapter.find().skip(skip).limit(limit);
    
    // Get question counts for each chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const questionCount = await Question.countDocuments({ 
          qbs_chapter_id: chapter.qbs_chapter_id 
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
 * @api {get} /Chapters/:id Get a single Chapter
 * @apiDescription Get a single Chapter
 * @apiName getChapterById
 * @apiGroup Chapter
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Chapter Chapter created.
 * @apiSuccess {String} Chapter._id Chapter _id.
 * @apiSuccess {String} Chapter.title Chapter title.
 * @apiSuccess {String} Chapter.text Chapter text.
 * @apiSuccess {Object} Chapter.author Chapter author.
 * @apiSuccess {String} Chapter.author._id Author id.
 * @apiSuccess {String} Chapter.author.username Author username.
 * @apiSuccess {String} Chapter.createdAt Chapter created date.
 * @apiSuccess {Boolean} favorite User have favorite Chapter
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
 *  author: {
 *    _id: '123312',
 *    username: 'Jon'
 *  },
 *  favorite: true
 * }
 *
 * @apiErrorExample {json} Chapter not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function getById(req, res, next) {
  try {
    const promise = await Promise.all([
      User.findById(req.user._id),
      Chapter.findById(req.params.id).populate('author'),
    ]);
    const favorite = promise[0]._favorites.ChapterIsFavorite(req.params.id);
    return res.status(HTTPStatus.OK).json({
      ...promise[1].toJSON(),
      favorite,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {Chapter} /Chapters Create a Chapter
 * @apiDescription Create a Chapter
 * @apiName createChapter
 * @apiGroup Chapter
 *
 * @apiParam (Body) {String} title Chapter title.
 * @apiParam (Body) {String} text Chapter text.
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Chapter Chapter created.
 * @apiSuccess {String} Chapter._id Chapter _id.
 * @apiSuccess {String} Chapter.title Chapter title.
 * @apiSuccess {String} Chapter.text Chapter text.
 * @apiSuccess {String} Chapter.author Chapter author id.
 * @apiSuccess {String} Chapter.createdAt Chapter created date.
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
export async function create(req, res, next) {
  const body = filteredBody(req.body, contants.WHITELIST.Chapters.create);
  try {
    return res
      .status(HTTPStatus.CREATED)
      .json(await Chapter.create(body, req.user._id));
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {delete} /Chapters/:id Delete a Chapter
 * @apiDescription Delete a Chapter if the author it's the right one
 * @apiName deleteChapter
 * @apiGroup Chapter
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Chapter unique ID.
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
 * @apiErrorExample {json} Chapter not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 *
 */
export async function deleteChapter(req, res, next) {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.sendStatus(HTTPStatus.UNAUTHORIZED);
    }
    await chapter.remove();
    return res.sendStatus(HTTPStatus.OK);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {patch} /Chapters/:id Update a Chapter
 * @apiDescription Update a Chapter if the author it's the right one
 * @apiName updateChapter
 * @apiGroup Chapter
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Chapter unique ID.
 *
 * @apiParam (Body) {String} [title] Chapter title.
 * @apiParam (Body) {String} [text] Chapter text.
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} Chapter Chapter updated.
 * @apiSuccess {String} Chapter._id Chapter _id.
 * @apiSuccess {String} Chapter.title Chapter title.
 * @apiSuccess {String} Chapter.text Chapter text.
 * @apiSuccess {String} Chapter.author Chapter author id.
 * @apiSuccess {String} Chapter.createdAt Chapter created date.
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
 *  title: 'New title',
 *  text: 'New text',
 *  createdAt: '2017-05-03',
 *  author: '123312'
 * }
 *
 * @apiErrorExample {json} Chapter not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function update(req, res, next) {
  const body = filteredBody(req.body, contants.WHITELIST.Chapters.update);
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.sendStatus(HTTPStatus.UNAUTHORIZED);
    }

    Object.keys(body).forEach(key => {
      chapter[key] = body[key];
    });

    return res.status(HTTPStatus.OK).json(await chapter.save());
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * Get chapters with pattern counts (if any)
 * GET /api/chapters/with-patterns
 */
export async function getChaptersWithPatternCounts(req, res, next) {
  try {
    // Get chapters with basic filtering
    const query = {};
    if (req.query.dept_id) query.qbs_dept_id = parseInt(req.query.dept_id);
    if (req.query.sub_id) query.qbs_sub_id = parseInt(req.query.sub_id);

    // Get base chapters data
    const chapters = await Chapter.find(query)
      .sort({ qbs_chapter_id: 1 })
      .lean()
      .exec();

    // Get question counts for chapters if needed
    let questionCounts = {};
    if (req.query.includeQuestions === 'true') {
      const counts = await Question.aggregate([
        { 
          $group: {
            _id: '$qbs_lesson_id',
            count: { $sum: 1 }
          }
        }
      ]);
      questionCounts = counts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});
    }

    // Get pattern counts from blueprint_marks if needed
    let patternCounts = {};
    if (req.query.includePatterns === 'true') {
      const patterns = await Blueprint.aggregate([
        { $unwind: '$blueprint_marks' },
        {
          $group: {
            _id: '$blueprint_marks.qbs_blp_chapter_id',
            count: { $sum: 1 }
          }
        }
      ]);
      patternCounts = patterns.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});
    }

    // Combine all data
    const result = {
      chapters: chapters.map(chapter => ({
        qbs_chapter_id: chapter.qbs_chapter_id,
        qbs_chapter_name: chapter.qbs_chapter_name,
        qbs_sub_id: chapter.qbs_sub_id,
        qbs_dept_id: chapter.qbs_dept_id,
        question_count: questionCounts[chapter.qbs_chapter_id] || 0,
        pattern_count: patternCounts[chapter.qbs_chapter_id] || 0
      }))
    };

    // Add pattern counts separately if they exist
    if (Object.keys(patternCounts).length > 0) {
      result.ptnCounts = patternCounts;
    }

    return res.status(HTTPStatus.OK).json(result);
  } catch (err) {
    console.error('Error in getChaptersWithPatternCounts:', err);
    return next(err);
  }
}

/**
 * Get chapters by subject and department
 * GET /api/chapters/by-subject/:subId/department/:deptId
 */
export async function getChaptersBySubjectAndDept(req, res, next) {
  try {
    const { subId, deptId } = req.params;

    const chapters = await Chapter.find({
      qbs_sub_id: parseInt(subId),
      qbs_dept_id: parseInt(deptId)
    })
    .sort({ qbs_chapter_id: 1 })
    .lean()
    .exec();

    return res.status(HTTPStatus.OK).json({
      chapters
    });
  } catch (err) {
    console.error('Error in getChaptersBySubjectAndDept:', err);
    return next(err);
  }
}
