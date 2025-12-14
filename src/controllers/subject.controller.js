/**
 * Subject Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import Joi from 'joi';
import { Subject, User } from '../models/index.js';
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

/**
 * Validation schemas
 */
export const validation = {
  create: {
    body: Joi.object({
      subject_name: Joi.string().min(2).max(255).required(),
      subject_code: Joi.string().max(50).allow('', null),
      description: Joi.string().allow('', null),
      is_active: Joi.boolean().default(true),
    }),
  },
  update: {
    body: Joi.object({
      subject_name: Joi.string().min(2).max(255),
      subject_code: Joi.string().max(50).allow('', null),
      description: Joi.string().allow('', null),
      is_active: Joi.boolean(),
    }),
  },
  assignSubject: {
    body: Joi.object({
      user_id: Joi.number().required(),
      subject_id: Joi.number().required(),
    }),
  },
};

/**
 * GET /api/subjects
 * List all subjects in tenant
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const activeOnly = req.query.active === 'true';

    const where = { ...tenantFilter(req) };
    if (activeOnly) {
      where.is_active = true;
    }
    console.log('Where filter:', where);
    const subjects = await Subject.findAll({
      where,
      order: [['subject_name', 'ASC']],
      limit,
      offset: skip,
    });

    const total = await Subject.count({ where });

    return res.status(HTTPStatus.OK).json({
      success: true,
      data: subjects,
      total,
      limit,
      offset: skip,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/subjects/:id
 * Get subject by ID
 */
export async function getById(req, res, next) {
  try {
    const subject = await Subject.findOne({
      where: {
        ...tenantFilter(req),
        subject_id: req.params.id,
      },
    });

    if (!subject) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'Subject not found',
      });
    }

    return res.status(HTTPStatus.OK).json({
      success: true,
      data: subject,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/subjects
 * Create a new subject (tenant admin only)
 */
export async function create(req, res, next) {
  try {
    const body = req.body;

    // Check for duplicate subject code in tenant
    if (body.subject_code) {
      const existing = await Subject.findOne({
        where: {
          ...tenantFilter(req),
          subject_code: body.subject_code,
        },
      });

      if (existing) {
        return res.status(HTTPStatus.CONFLICT).json({
          success: false,
          message: 'Subject code already exists in this tenant',
          code: 'DUPLICATE_SUBJECT_CODE',
        });
      }
    }

    const subject = await Subject.create({
      ...tenantData(req),
      subject_name: body.subject_name,
      subject_code: body.subject_code || null,
      description: body.description || null,
      is_active: body.is_active !== false,
      created_by: req.user.user_id,
    });

    return res.status(HTTPStatus.CREATED).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * PUT /api/subjects/:id
 * Update subject
 */
export async function update(req, res, next) {
  try {
    const subject = await Subject.findOne({
      where: {
        ...tenantFilter(req),
        subject_id: req.params.id,
      },
    });

    if (!subject) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const body = req.body;
    const updateData = {};

    if (body.subject_name !== undefined) updateData.subject_name = body.subject_name;
    if (body.subject_code !== undefined) updateData.subject_code = body.subject_code;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Check for duplicate subject code if updating
    if (body.subject_code && body.subject_code !== subject.subject_code) {
      const existing = await Subject.findOne({
        where: {
          ...tenantFilter(req),
          subject_code: body.subject_code,
          subject_id: { [require('sequelize').Op.ne]: subject.subject_id },
        },
      });

      if (existing) {
        return res.status(HTTPStatus.CONFLICT).json({
          success: false,
          message: 'Subject code already exists in this tenant',
          code: 'DUPLICATE_SUBJECT_CODE',
        });
      }
    }

    await subject.update(updateData);

    return res.status(HTTPStatus.OK).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/subjects/:id
 * Delete subject
 */
export async function deleteSubject(req, res, next) {
  try {
    // Check if any users are assigned to this subject
    const usersWithSubject = await User.count({
      where: {
        ...tenantFilter(req),
        subject_id: req.params.id,
      },
    });

    if (usersWithSubject > 0) {
      return res.status(HTTPStatus.CONFLICT).json({
        success: false,
        message: `Cannot delete subject. ${usersWithSubject} user(s) are assigned to this subject.`,
        code: 'SUBJECT_IN_USE',
      });
    }

    const deleted = await Subject.destroy({
      where: {
        ...tenantFilter(req),
        subject_id: req.params.id,
      },
    });

    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'Subject not found',
      });
    }

    return res.status(HTTPStatus.OK).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/subjects/assign
 * Assign a subject to a user (staff/teacher)
 */
export async function assignSubjectToUser(req, res, next) {
  try {
    const { user_id, subject_id } = req.body;

    // Verify subject exists in tenant
    const subject = await Subject.findOne({
      where: {
        ...tenantFilter(req),
        subject_id,
      },
    });

    if (!subject) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'Subject not found in this tenant',
      });
    }

    // Verify user exists in tenant
    const user = await User.findOne({
      where: {
        ...tenantFilter(req),
        user_id,
      },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found in this tenant',
      });
    }

    // Update user with subject assignment
    await user.update({
      subject_id: subject.subject_id,
      subject: subject.subject_name,
    });

    return res.status(HTTPStatus.OK).json({
      success: true,
      message: `Subject "${subject.subject_name}" assigned to user "${user.username}" successfully`,
      data: {
        user_id: user.user_id,
        username: user.username,
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
      },
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * DELETE /api/subjects/assign/:userId
 * Remove subject assignment from user
 */
export async function removeSubjectFromUser(req, res, next) {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({
      where: {
        ...tenantFilter(req),
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found in this tenant',
      });
    }

    await user.update({
      subject_id: null,
      subject: null,
    });

    return res.status(HTTPStatus.OK).json({
      success: true,
      message: `Subject assignment removed from user "${user.username}"`,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/subjects/:id/users
 * Get all users assigned to a subject
 */
export async function getUsersBySubject(req, res, next) {
  try {
    const subjectId = req.params.id;

    // Verify subject exists
    const subject = await Subject.findOne({
      where: {
        ...tenantFilter(req),
        subject_id: subjectId,
      },
    });

    if (!subject) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const users = await User.findAll({
      where: {
        ...tenantFilter(req),
        subject_id: subjectId,
      },
      attributes: ['user_id', 'username', 'email', 'user_fname', 'role', 'is_active'],
      order: [['username', 'ASC']],
    });

    return res.status(HTTPStatus.OK).json({
      success: true,
      data: {
        subject,
        users,
        total: users.length,
      },
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
