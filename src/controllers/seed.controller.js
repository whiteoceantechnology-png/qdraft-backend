/**
 * Seed controller for fill your db of fake data
 * Sequelize/MariaDB version
 */

import HTTPStatus from 'http-status';

import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import { userSeed, deleteUserSeed } from '../seeds/user.seed.js';

export async function seedUsers(req, res, next) {
  try {
    await userSeed(req.params.count);

    return res
      .status(HTTPStatus.OK)
      .send(`User seed success! Created ${req.params.count || 10} users!`);
  } catch (e) {
    e.status = HTTPStatus.BAD_REQUEST;
    return next(e);
  }
}

export async function clearSeedUsers(req, res, next) {
  try {
    await deleteUserSeed();

    return res.status(HTTPStatus.OK).send('User table empty');
  } catch (e) {
    e.status = HTTPStatus.BAD_REQUEST;
    return next(e);
  }
}

/**
 * Take all your model and clear it
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {String} All tables clear
 */
export async function clearAll(req, res, next) {
  try {
    // Sequelize destroy with truncate
    await Promise.all([
      User.destroy({ where: {}, truncate: true }),
      Post.destroy({ where: {}, truncate: true })
    ]);

    return res.status(HTTPStatus.OK).send('All tables clear');
  } catch (e) {
    e.status = HTTPStatus.BAD_REQUEST;
    return next(e);
  }
}
