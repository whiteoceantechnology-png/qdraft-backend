/**
 * User Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/database.js';
import constants from '../config/constants.js';

class User extends Model {
  /**
   * Authenticate the user password
   */
  authenticateUser(password) {
    return bcrypt.compareSync(password, this.password);
  }

  /**
   * Generate JWT token with tenant_id included
   */
  createToken() {
    return jwt.sign(
      {
        user_id: this.user_id,
        tenant_id: this.tenant_id,
        role: this.role,
      },
      constants.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Return user data for authentication response
   */
  toAuthJSON() {
    return {
      access_token: `JWT ${this.createToken()}`,
      user_id: this.user_id,
      tenant_id: this.tenant_id,
      user_fname: this.user_fname,
      username: this.username,
      email: this.email,
      role: this.role,
      setup_id: this.setup_id,
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
   * Return minimal user data
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
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenant_id',
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_fname: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING(50),
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
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(100),
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
    role: {
      type: DataTypes.ENUM('super_admin', 'tenant_admin', 'teacher', 'user'),
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    favorites: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'email'],
        name: 'unique_tenant_email',
      },
      {
        unique: true,
        fields: ['tenant_id', 'username'],
        name: 'unique_tenant_username',
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

export default User;
