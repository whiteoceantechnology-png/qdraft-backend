/**
 * Authentication Controller - Sequelize for MariaDB
 */

import HTTPStatus from 'http-status';
import Joi from 'joi';

export const validation = {
  login: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
    },
  },
};

/**
 * Login a user
 */
export async function login(req, res, next) {
  try {
    const respObj = {
      message: 'Login successful',
      authData: req.user,
    };
    return res.status(HTTPStatus.OK).json(respObj);
  } catch (error) {
    return next(error);
  }
}
