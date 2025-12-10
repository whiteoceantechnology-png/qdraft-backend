/**
 * User Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { Op } from 'sequelize';
import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
import { tenantFilter, tenantData, requireTenantAdmin } from '../middlewares/tenant.middleware.js';

/**
 * GET /api/users
 * List users in tenant (tenant admin only)
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const users = await User.findAll({
      where: tenantFilter(req),
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit,
      offset: skip,
    });

    return res.status(HTTPStatus.OK).json(users);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/users/:id
 * Get user by ID
 */
export async function getById(req, res, next) {
  try {
    const user = await User.findOne({
      where: {
        ...tenantFilter(req),
        user_id: req.params.id,
      },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    return res.status(HTTPStatus.OK).json(user);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/users
 * Create a new user in tenant (tenant admin only)
 */
export async function create(req, res, next) {
  try {
    const body = req.body;

    // Check if email already exists in tenant
    const existingEmail = await User.findOne({
      where: {
        ...tenantFilter(req),
        email: body.email,
      },
    });

    if (existingEmail) {
      return res.status(HTTPStatus.CONFLICT).json({ message: 'Email already exists' });
    }

    // Check if username already exists in tenant
    const existingUsername = await User.findOne({
      where: {
        ...tenantFilter(req),
        username: body.username,
      },
    });

    if (existingUsername) {
      return res.status(HTTPStatus.CONFLICT).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      ...tenantData(req),
      email: body.email,
      username: body.username,
      password: body.password,
      user_fname: body.user_fname,
      mobile_number: body.mobile_number,
      school_name: body.school_name,
      setup_id: body.setup_id,
      board: body.board,
      class_name: body.class_name,
      dept_id: body.dept_id,
      subject: body.subject,
      subject_id: body.subject_id,
      medium: body.medium,
      role: body.role || 'user',
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(HTTPStatus.CREATED).json({
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/users/:id
 * Update user
 */
export async function update(req, res, next) {
  try {
    const user = await User.findOne({
      where: {
        ...tenantFilter(req),
        user_id: req.params.id,
      },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    // Only allow tenant admins to update other users
    if (req.user.user_id !== user.user_id && req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
      return res.status(HTTPStatus.FORBIDDEN).json({ message: 'Permission denied' });
    }

    const body = req.body;
    const updateData = {};

    if (body.email) updateData.email = body.email;
    if (body.user_fname) updateData.user_fname = body.user_fname;
    if (body.mobile_number) updateData.mobile_number = body.mobile_number;
    if (body.school_name) updateData.school_name = body.school_name;
    if (body.setup_id) updateData.setup_id = body.setup_id;
    if (body.board) updateData.board = body.board;
    if (body.class_name) updateData.class_name = body.class_name;
    if (body.dept_id) updateData.dept_id = body.dept_id;
    if (body.subject) updateData.subject = body.subject;
    if (body.subject_id) updateData.subject_id = body.subject_id;
    if (body.medium) updateData.medium = body.medium;
    if (body.password) updateData.password = body.password;

    // Only admins can change roles
    if (body.role && (req.user.role === 'tenant_admin' || req.user.role === 'super_admin')) {
      updateData.role = body.role;
    }

    await user.update(updateData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(HTTPStatus.OK).json({
      message: 'User updated successfully',
      user: userResponse,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/users/:id
 * Delete user (tenant admin only)
 */
export async function deleteUser(req, res, next) {
  try {
    // Prevent self-deletion
    if (req.user.user_id === parseInt(req.params.id)) {
      return res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Cannot delete yourself' });
    }

    const deleted = await User.destroy({
      where: {
        ...tenantFilter(req),
        user_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    return res.status(HTTPStatus.OK).json({ message: 'User deleted successfully' });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/users/me
 * Get current user profile
 */
export async function getProfile(req, res, next) {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_id', 'tenant_name', 'logo_url', 'primary_color', 'subscription_plan'],
        },
      ],
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    return res.status(HTTPStatus.OK).json(user);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/users/me
 * Update current user profile
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }

    const body = req.body;
    const updateData = {};

    if (body.user_fname) updateData.user_fname = body.user_fname;
    if (body.mobile_number) updateData.mobile_number = body.mobile_number;
    if (body.password) updateData.password = body.password;

    await user.update(updateData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(HTTPStatus.OK).json({
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
