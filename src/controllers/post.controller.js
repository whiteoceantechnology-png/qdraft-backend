/**
 * Post Controller - Sequelize for MariaDB
 * Multi-tenant support with tenant_id filtering
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';

/**
 * Validation schemas
 */
export const validation = {
  create: {
    body: Joi.object({
      title: Joi.string().min(3).required(),
      text: Joi.string().min(10).required(),
    }),
  },
  update: {
    body: Joi.object({
      title: Joi.string().min(3),
      text: Joi.string().min(10),
    }),
  },
};

/**
 * GET /api/posts
 * Get all posts with pagination (tenant-scoped)
 */
export async function getList(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      where: { tenant_id: req.tenantId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'username', 'email', 'user_fname'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.status(HTTPStatus.OK).json({
      posts,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/posts/:id
 * Get post by ID (tenant-scoped)
 */
export async function getById(req, res, next) {
  try {
    const post = await Post.findOne({
      where: {
        post_id: req.params.id,
        tenant_id: req.tenantId,
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'username', 'email', 'user_fname'],
        },
      ],
    });

    if (!post) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Post not found',
      });
    }

    return res.status(HTTPStatus.OK).json(post);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/posts
 * Create a new post (tenant-scoped)
 */
export async function create(req, res, next) {
  try {
    const post = await Post.create({
      tenant_id: req.tenantId,
      title: req.body.title,
      text: req.body.text,
      author_id: req.user.user_id,
    });

    // Fetch with author details
    const postWithAuthor = await Post.findOne({
      where: { post_id: post.post_id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'username', 'email', 'user_fname'],
        },
      ],
    });

    return res.status(HTTPStatus.CREATED).json(postWithAuthor);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PATCH /api/posts/:id
 * Update a post (tenant-scoped, author only)
 */
export async function updatePost(req, res, next) {
  try {
    const post = await Post.findOne({
      where: {
        post_id: req.params.id,
        tenant_id: req.tenantId,
      },
    });

    if (!post) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Post not found',
      });
    }

    // Check if user is author
    if (post.author_id !== req.user.user_id) {
      return res.status(HTTPStatus.UNAUTHORIZED).json({
        message: 'Unauthorized to update this post',
      });
    }

    const updateFields = {};
    if (req.body.title) updateFields.title = req.body.title;
    if (req.body.text) updateFields.text = req.body.text;

    await post.update(updateFields);

    // Fetch with author details
    const updatedPost = await Post.findOne({
      where: { post_id: post.post_id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'username', 'email', 'user_fname'],
        },
      ],
    });

    return res.status(HTTPStatus.OK).json(updatedPost);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/posts/:id
 * Delete a post (tenant-scoped, author only)
 */
export async function deletePost(req, res, next) {
  try {
    const post = await Post.findOne({
      where: {
        post_id: req.params.id,
        tenant_id: req.tenantId,
      },
    });

    if (!post) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Post not found',
      });
    }

    // Check if user is author
    if (post.author_id !== req.user.user_id) {
      return res.status(HTTPStatus.UNAUTHORIZED).json({
        message: 'Unauthorized to delete this post',
      });
    }

    await post.destroy();

    return res.status(HTTPStatus.OK).json({
      message: 'Post deleted successfully',
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/posts/:id/favorite
 * Toggle favorite on a post (tenant-scoped)
 */
export async function favoritePost(req, res, next) {
  try {
    const post = await Post.findOne({
      where: {
        post_id: req.params.id,
        tenant_id: req.tenantId,
      },
    });

    if (!post) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Post not found',
      });
    }

    // Get user to check favorites
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
    });

    // Get current favorites (stored as JSON array in user)
    let favorites = user.favorites || [];

    const postId = post.post_id;
    const isFavorited = favorites.includes(postId);

    if (isFavorited) {
      // Remove from favorites
      favorites = favorites.filter((id) => id !== postId);
      await post.update({ favoriteCount: Math.max(0, post.favoriteCount - 1) });
    } else {
      // Add to favorites
      favorites.push(postId);
      await post.update({ favoriteCount: post.favoriteCount + 1 });
    }

    // Update user favorites
    await user.update({ favorites });

    // Fetch updated post
    const updatedPost = await Post.findOne({
      where: { post_id: postId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'username', 'email', 'user_fname'],
        },
      ],
    });

    return res.status(HTTPStatus.OK).json({
      post: updatedPost,
      isFavorited: !isFavorited,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
