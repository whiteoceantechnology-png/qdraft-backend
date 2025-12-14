/**
 * Authentication Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import Joi from 'joi';
import { User, Tenant } from '../models/index.js';

/**
 * Validation schemas
 */
export const validation = {
  login: {
    body: Joi.object({
      username: Joi.string().required().messages({
        'string.empty': 'Username is required',
        'any.required': 'Username is required',
      }),
      password: Joi.string().required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
      }),
    }),
  },
  register: {
    body: Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      user_fname: Joi.string().allow('', null),
      mobile_number: Joi.string().allow('', null),
      tenant_id: Joi.number().allow(null),
      tenant_code: Joi.string().allow('', null),
    }),
  },
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }),
  },
};

/**
 * POST /api/auth/login
 * Login with local strategy (handled by passport)
 */
export function login(req, res) {
  // req.user is set by passport local strategy
  return res.status(HTTPStatus.OK).json(req.user);
}

/**
 * POST /api/auth/register
 * Register a new user (for tenant self-registration if enabled)
 */
export async function register(req, res, next) {
  try {
    const body = req.body;

    // Check if tenant_id is provided or needs to be created
    let tenantId = body.tenant_id;

    // If registering with a tenant code
    if (body.tenant_code) {
      const tenant = await Tenant.findOne({
        where: { tenant_code: body.tenant_code, is_active: true },
      });

      if (!tenant) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: 'Invalid tenant code',
        });
      }

      tenantId = tenant.tenant_id;
    }

    if (!tenantId) {
      return res.status(HTTPStatus.BAD_REQUEST).json({
        message: 'Tenant ID or tenant code is required',
      });
    }

    // Check if email already exists in tenant
    const existingEmail = await User.findOne({
      where: { tenant_id: tenantId, email: body.email },
    });

    if (existingEmail) {
      return res.status(HTTPStatus.CONFLICT).json({
        message: 'Email already registered',
      });
    }

    // Check if username already exists in tenant
    const existingUsername = await User.findOne({
      where: { tenant_id: tenantId, username: body.username },
    });

    if (existingUsername) {
      return res.status(HTTPStatus.CONFLICT).json({
        message: 'Username already taken',
      });
    }

    // Create user
    const user = await User.create({
      tenant_id: tenantId,
      email: body.email,
      username: body.username,
      password: body.password,
      user_fname: body.user_fname,
      mobile_number: body.mobile_number,
      role: 'user', // Default role for self-registration
    });

    // Get tenant info
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['tenant_id', 'tenant_name', 'subscription_plan', 'features'],
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Registration successful',
      ...user.toAuthJSON(),
      tenant: tenant ? tenant.toJSON() : null,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: [
            'tenant_id',
            'tenant_name',
            'tenant_code',
            'logo_url',
            'favicon_url',
            'primary_color',
            'secondary_color',
            'subscription_plan',
            'features',
            'settings',
          ],
        },
      ],
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'User not found',
      });
    }

    return res.status(HTTPStatus.OK).json(user);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTPStatus.BAD_REQUEST).json({
        message: 'Current password and new password are required',
      });
    }

    const user = await User.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'User not found',
      });
    }

    // Verify current password
    if (!user.authenticateUser(currentPassword)) {
      return res.status(HTTPStatus.UNAUTHORIZED).json({
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await user.update({ password: newPassword });

    return res.status(HTTPStatus.OK).json({
      message: 'Password changed successfully',
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
export async function refreshToken(req, res, next) {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_id', 'tenant_name', 'subscription_plan', 'features'],
        },
      ],
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'User not found',
      });
    }

    return res.status(HTTPStatus.OK).json({
      ...user.toAuthJSON(),
      tenant: user.tenant ? user.tenant.toJSON() : null,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
