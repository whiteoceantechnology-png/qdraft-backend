/**
 * Post Controller - Sequelize/MariaDB
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import contants from '../config/constants.js';

import { filteredBody } from '../utils/filteredBody.js';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';

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
 * @api {get} /posts Get posts
 * @apiDescription Get a list of posts
 * @apiName getListOfPost
 * @apiGroup Post
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam (query) {Int} skip Number of skip posts
 * @apiParam (query) {Int} limit Maximum number of posts
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object[]} post Post list.
 * @apiSuccess {String} post._id Post _id.
 * @apiSuccess {String} post.title Post title.
 * @apiSuccess {String} post.text Post text.
 * @apiSuccess {Object} post.author Post author.
 * @apiSuccess {String} post.author._id Post author _id.
 * @apiSuccess {String} post.author.username Post author username.
 * @apiSuccess {String} post.createdAt Post created date.
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
 *  }
 * ]
 *
 * @apiErrorExample {json} Post not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function getList(req, res, next) {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['user_id', 'username', 'name']
      }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limit
    });

    return res.status(HTTPStatus.OK).json(posts);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {get} /posts/:id Get a single post
 * @apiDescription Get a single post
 * @apiName getPost
 * @apiGroup Post
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} post Post created.
 * @apiSuccess {String} post._id Post _id.
 * @apiSuccess {String} post.title Post title.
 * @apiSuccess {String} post.text Post text.
 * @apiSuccess {Object} post.author Post author.
 * @apiSuccess {String} post.author._id Author id.
 * @apiSuccess {String} post.author.username Author username.
 * @apiSuccess {String} post.createdAt Post created date.
 * @apiSuccess {Boolean} favorite User have favorite post
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
 * @apiErrorExample {json} Post not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function getById(req, res, next) {
  try {
    const post = await Post.findOne({
      where: { post_id: req.params.id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['user_id', 'username', 'name']
      }]
    });

    if (!post) {
      return res.sendStatus(HTTPStatus.NOT_FOUND);
    }

    // Check if user has favorited this post
    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    const favorites = user?.favorites || [];
    const favorite = favorites.includes(parseInt(req.params.id));

    return res.status(HTTPStatus.OK).json({
      ...post.toJSON(),
      favorite,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {post} /posts Create a post
 * @apiDescription Create a post
 * @apiName createPost
 * @apiGroup Post
 *
 * @apiParam (Body) {String} title Post title.
 * @apiParam (Body) {String} text Post text.
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} post Post created.
 * @apiSuccess {String} post._id Post _id.
 * @apiSuccess {String} post.title Post title.
 * @apiSuccess {String} post.text Post text.
 * @apiSuccess {String} post.author Post author id.
 * @apiSuccess {String} post.createdAt Post created date.
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
  const body = filteredBody(req.body, contants.WHITELIST.posts.create);
  try {
    const post = await Post.create({
      ...body,
      author_id: req.user.user_id
    });

    return res.status(HTTPStatus.CREATED).json(post);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {delete} /posts/:id Delete a post
 * @apiDescription Delete a post if the author it's the right one
 * @apiName deletePost
 * @apiGroup Post
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Post unique ID.
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
 * @apiErrorExample {json} Post not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 *
 */
export async function deletePost(req, res, next) {
  try {
    const post = await Post.findOne({ where: { post_id: req.params.id } });

    if (!post) {
      return res.sendStatus(HTTPStatus.NOT_FOUND);
    }

    if (post.author_id !== req.user.user_id) {
      return res.sendStatus(HTTPStatus.UNAUTHORIZED);
    }

    await post.destroy();
    return res.sendStatus(HTTPStatus.OK);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {patch} /posts/:id Update a post
 * @apiDescription Update a post if the author it's the right one
 * @apiName updatePost
 * @apiGroup Post
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Post unique ID.
 *
 * @apiParam (Body) {String} [title] Post title.
 * @apiParam (Body) {String} [text] Post text.
 *
 * @apiSuccess {Number} status Status of the Request.
 * @apiSuccess {Object} post Post updated.
 * @apiSuccess {String} post._id Post _id.
 * @apiSuccess {String} post.title Post title.
 * @apiSuccess {String} post.text Post text.
 * @apiSuccess {String} post.author Post author id.
 * @apiSuccess {String} post.createdAt Post created date.
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
 * @apiErrorExample {json} Post not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function updatePost(req, res, next) {
  const body = filteredBody(req.body, contants.WHITELIST.posts.update);
  try {
    const post = await Post.findOne({ where: { post_id: req.params.id } });

    if (!post) {
      return res.sendStatus(HTTPStatus.NOT_FOUND);
    }

    if (post.author_id !== req.user.user_id) {
      return res.sendStatus(HTTPStatus.UNAUTHORIZED);
    }

    await post.update(body);
    return res.status(HTTPStatus.OK).json(post);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * @api {post} /posts/:id/favorite Favorite a post
 * @apiDescription Favorite a post or unfavorite if already.
 * @apiName favoritePost
 * @apiGroup Post
 *
 * @apiHeader {Authorization} Authorization JWT Token
 *
 * @apiParam {String} id Post unique ID.
 *
 * @apiSuccess {Number} status Status of the Request.
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
 * @apiErrorExample {json} Post not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 */
export async function favoritePost(req, res, next) {
  try {
    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    const postId = parseInt(req.params.id);
    
    // Toggle favorite - add if not exists, remove if exists
    let favorites = user.favorites || [];
    const index = favorites.indexOf(postId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(postId);
    }
    
    await user.update({ favorites });
    return res.sendStatus(HTTPStatus.OK);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
