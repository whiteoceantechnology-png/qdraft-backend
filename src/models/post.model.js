/**
 * Post Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import slugify from 'slug';
import sequelize from '../config/database.js';

class Post extends Model {
  /**
   * Slug the title
   */
  slugify() {
    this.slug = slugify(this.title);
  }

  /**
   * Parse the post for response
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      text: this.text,
      slug: this.slug,
      author: this.author,
      favoriteCount: this.favoriteCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create a post
   */
  static async createPost(args, authorId) {
    return this.create({
      ...args,
      author: authorId,
    });
  }

  /**
   * List posts with pagination
   */
  static async list({ skip = 0, limit = 10 } = {}) {
    return this.findAll({
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limit,
    });
  }

  /**
   * Increment favorite count
   */
  static async incFavoriteCount(postId) {
    return this.increment('favoriteCount', { where: { id: postId } });
  }

  /**
   * Decrement favorite count
   */
  static async decFavoriteCount(postId) {
    return this.decrement('favoriteCount', { where: { id: postId } });
  }
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [3, 255],
          msg: 'Title must be at least 3 characters',
        },
      },
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    author: {
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
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeValidate: (post) => {
        if (post.title) {
          post.slug = slugify(post.title);
        }
      },
    },
  }
);

export default Post;
