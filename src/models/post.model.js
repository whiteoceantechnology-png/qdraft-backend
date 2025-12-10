/**
 * Post Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import slug from 'slug';
import { sequelize } from '../config/database.js';

class Post extends Model {}

Post.init(
  {
    post_id: {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    favoriteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['author_id'] },
      { unique: true, fields: ['tenant_id', 'slug'] },
    ],
    hooks: {
      beforeCreate: (post) => {
        if (post.title) {
          post.slug = slug(post.title, { lower: true });
        }
      },
      beforeUpdate: (post) => {
        if (post.changed('title')) {
          post.slug = slug(post.title, { lower: true });
        }
      },
    },
  }
);

export default Post;
