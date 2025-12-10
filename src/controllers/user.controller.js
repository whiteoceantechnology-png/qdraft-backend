/**
 * User Controller - Sequelize for MariaDB
 */

import Joi from 'joi';
import HTTPStatus from 'http-status';
import { filteredBody } from '../utils/filteredBody.js';
import constants from '../config/constants.js';
import User from '../models/user.model.js';

export const validation = {
  create: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().min(6).regex(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).required(),
      username: Joi.string().min(3).max(20).required(),
    },
  },
};

/**
 * Create a user
 */
export async function create(req, res, next) {
  const body = filteredBody(req.body, constants.WHITELIST.users.create);
  try {
    const user = await User.create(body);
    return res.status(HTTPStatus.CREATED).json(user.toAuthJSON());
  } catch (e) {
    e.status = HTTPStatus.BAD_REQUEST;
    return next(e);
  }
}

/**
 * Get all users
 */
export async function getUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['user_id', 'DESC']]
    });
    return res.status(HTTPStatus.OK).json(users);
  } catch (e) {
    return next(e);
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req, res, next) {
  try {
    const user = await User.findOne({
      where: { user_id: req.params.id },
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }
    return res.status(HTTPStatus.OK).json(user);
  } catch (e) {
    return next(e);
  }
}

/**
 * Update user
 */
export async function updateUser(req, res, next) {
  try {
    const user = await User.findOne({ where: { user_id: req.params.id } });
    if (!user) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }
    
    const allowedFields = ['user_fname', 'school_name', 'board', 'class_name', 'subject', 'medium'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    
    await user.update(updateData);
    return res.status(HTTPStatus.OK).json(user);
  } catch (e) {
    return next(e);
  }
}

/**
 * Delete user
 */
export async function deleteUser(req, res, next) {
  try {
    const deleted = await User.destroy({ where: { user_id: req.params.id } });
    if (!deleted) {
      return res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found' });
    }
    return res.status(HTTPStatus.OK).json({ message: 'User deleted successfully' });
  } catch (e) {
    return next(e);
  }
}
