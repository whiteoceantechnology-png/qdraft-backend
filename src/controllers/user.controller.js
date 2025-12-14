/**
 * User Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import Joi from 'joi';
import { Op } from 'sequelize';
import { User, Tenant } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * Validation schemas
 */
export const validation = {
  create: {
    body: Joi.object({
      email: Joi.string().email().required(),
      username: Joi.string().min(3).max(50).required(),
      password: Joi.string().min(6).required(),
      user_fname: Joi.string().allow('', null),
      mobile_number: Joi.string().allow('', null),
      school_name: Joi.string().allow('', null),
      board: Joi.string().allow('', null),
      class_name: Joi.string().allow('', null),
      subject: Joi.string().allow('', null),
      role: Joi.string().valid('super_admin', 'tenant_admin', 'teacher', 'user').default('user'),
      tenant_id: Joi.number().allow(null),
      tenant_code: Joi.string().allow('', null),
    }),
  },
  update: {
    body: Joi.object({
      email: Joi.string().email(),
      user_fname: Joi.string().allow('', null),
      mobile_number: Joi.string().allow('', null),
      school_name: Joi.string().allow('', null),
      board: Joi.string().allow('', null),
      class_name: Joi.string().allow('', null),
      subject: Joi.string().allow('', null),
      role: Joi.string().valid('super_admin', 'tenant_admin', 'teacher', 'user'),
    }),
  },
};

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
 * Tenant admin can create: user, teacher
 * Super admin can create: any role including super_admin
 */
export async function create(req, res, next) {
  try {
    const body = req.body;
    const requestedRole = body.role || 'user';

    // Role-based validation
    if (req.user.role === 'tenant_admin') {
      // Tenant admin can only create user or teacher
      if (!['user', 'teacher'].includes(requestedRole)) {
        return res.status(HTTPStatus.FORBIDDEN).json({
          success: false,
          message: 'Tenant admin can only create users with role: user or teacher',
          code: 'INVALID_ROLE_FOR_TENANT_ADMIN',
        });
      }
    } else if (req.user.role === 'super_admin') {
      // Super admin can create any role
      if (!['super_admin', 'tenant_admin', 'teacher', 'user'].includes(requestedRole)) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid role specified',
          code: 'INVALID_ROLE',
        });
      }
      
      // For tenant_admin role, tenant_id is required
      if (requestedRole === 'tenant_admin' && !body.tenant_id) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          success: false,
          message: 'tenant_id is required when creating a tenant admin',
          code: 'TENANT_ID_REQUIRED',
        });
      }
    } else {
      // Other roles cannot create users
      return res.status(HTTPStatus.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions to create users',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Determine tenant_id: super_admin can specify it, otherwise use from JWT
    let targetTenantId;
    if (req.user.role === 'super_admin' && body.tenant_id) {
      // Verify the tenant exists
      const tenantExists = await Tenant.findByPk(body.tenant_id);
      if (!tenantExists) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          success: false,
          message: 'Specified tenant does not exist',
          code: 'TENANT_NOT_FOUND',
        });
      }
      targetTenantId = body.tenant_id;
    } else {
      targetTenantId = tenantData(req).tenant_id;
      console.log('targetTenantId', targetTenantId);  
    }

    // Check if email already exists in target tenant
    const existingEmail = await User.findOne({
      where: {
        tenant_id: targetTenantId,
        email: body.email,
      },
    });

    if (existingEmail) {
      return res.status(HTTPStatus.CONFLICT).json({
        success: false,
        message: 'Email already exists in this tenant',
        code: 'DUPLICATE_EMAIL',
      });
    }

    // Check if username already exists in target tenant
    const existingUsername = await User.findOne({
      where: {
        tenant_id: targetTenantId,
        username: body.username,
      },
    });

    if (existingUsername) {
      return res.status(HTTPStatus.CONFLICT).json({
        success: false,
        message: 'Username already exists in this tenant',
        code: 'DUPLICATE_USERNAME',
      });
    }

    const user = await User.create({
      tenant_id: targetTenantId,
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
      role: requestedRole,
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(HTTPStatus.CREATED).json({
      success: true,
      message: `${requestedRole.replace('_', ' ')} created successfully`,
      data: userResponse,
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
