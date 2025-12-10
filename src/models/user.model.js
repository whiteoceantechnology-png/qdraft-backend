/**
 * User Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import constants from '../config/constants.js';

class User extends Model {
  /**
   * Authenticate the user
   * @param {String} password - provided by the user
   * @returns {Boolean} isMatch - password match
   */
  authenticateUser(password) {
    return bcrypt.compareSync(password, this.password);
  }

  /**
   * Hash the user password
   * @param {String} password - user password
   * @returns {String} password - hashed password
   */
  static hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Generate a jwt token for authentication
   * @returns {String} token - JWT token
   */
  createToken() {
    return jwt.sign(
      { user_id: this.user_id },
      constants.JWT_SECRET
    );
  }

  /**
   * Parse the user object for auth response
   * @returns {Object} User - ready for auth
   */
  toAuthJSON() {
    return {
      access_token: `JWT ${this.createToken()}`,
      user_id: this.user_id,
      user_fname: this.user_fname,
      username: this.username,
      setup_id: this.setup_id,
      email: this.email,
      school_name: this.school_name,
      subject: this.subject,
      subject_id: this.subject_id,
      board: this.board,
      class_name: this.class_name,
      medium: this.medium,
      start_date: this.start_date,
      end_date: this.end_date,
    };
  }

  /**
   * Parse the user object for populate
   * @returns {Object} User - basic info
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
      },
    },
    mobile_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    user_fname: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    setup_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    board: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    class_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    medium: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_demo_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = User.hashPassword(user.password);
        }
      },
    },
  }
);

export default User;
