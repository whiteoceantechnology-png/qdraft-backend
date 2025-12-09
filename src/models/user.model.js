/* eslint-disable import/no-mutable-exports */

import mongoose, { Schema } from 'mongoose';
import { hashSync, compareSync } from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import uniqueValidator from 'mongoose-unique-validator';

import constants from '../config/constants.js';

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, 'Email is required!'],
      trim: true,
      validate: {
        validator(email) {
          const emailRegex = /^[-a-z0-9%S_+]+(\.[-a-z0-9%S_+]+)*@(?:[a-z0-9-]{1,63}\.){1,125}[a-z]{2,63}$/i;
          return emailRegex.test(email);
        },
        message: '{VALUE} is not a valid email!',
      },
    },
    mobile_number: {
      type: String,
      trim: true,
    },
    user_fname: {
      type: String,
      trim: true,     
    },
    user_id: {
      type: Number,
      unique: true,
    },
    school_name: {
      type: String,
      trim: true,
    },
    setup_id: {
      type: Number,
    },  
    board: {
      type: String,
      trim: true,
    },
    class_name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
    },
    dept_id: {
      type: Number,
    },
    subject: {
      type: String,
      trim: true,
    },
    subject_id: {
      type: Number,
    },  
    medium: {
      type: Number,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    is_demo_user: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, 'Password is required!'],
      trim: true,
      minlength: [6, 'Password need to be longer!'],
      validate: {
        validator(password) {
          // At least 6 chars and at least one digit
          return typeof password === 'string' && password.length >= 6 && /\d/.test(password);
        },
        message: 'Password must be at least 6 characters and contain a number!',
      },
    },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.plugin(uniqueValidator, {
  message: '{VALUE} already taken!',
});

// Hash the user password and assign user_id on creation
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = this._hashPassword(this.password);
  }
  if (this.isNew) {
    const lastUser = await mongoose.models.User.findOne().sort('-user_id').exec();
    this.user_id = lastUser ? lastUser.user_id + 1 : 10000;
  }
  next();
});

UserSchema.methods = {
  /**
   * Favorites actions
   *
   * @public
   */
  /**
   * Authenticate the user
   *
   * @public
   * @param {String} password - provided by the user
   * @returns {Boolean} isMatch - password match
   */
  authenticateUser(password) {
    return compareSync(password, this.password);
  },
  /**
   * Hash the user password
   *
   * @private
   * @param {String} password - user password choose
   * @returns {String} password - hash password
   */
  _hashPassword(password) {
    return hashSync(password);
  },

  /**
   * Generate a jwt token for authentication
   *
   * @public
   * @returns {String} token - JWT token
   */
  createToken() {
    return jwt.sign(
      {
        user_id: this.user_id,
      },
      constants.JWT_SECRET,
    );
  },

  /**
   * Parse the user object in data we wanted to send when is auth
   *
   * @public
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
      medium: this.medium,
    };
  },

  /**
   * Parse the user object in data we wanted to send
   *
   * @public
   * @returns {Object} User - ready for populate
   */
  toJSON() {
    return {
      user_id: this.user_id,
      username: this.username,
    };
  },
};


  const User = mongoose.model('User', UserSchema);


export default User;
