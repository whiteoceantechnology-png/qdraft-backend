/**
 * Chapter Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Chapter extends Model {}

Chapter.init(
  {
    qbs_chapter_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qbs_chapter_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    qbs_dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_sub_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Chapter',
    tableName: 'chapters',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
);

export default Chapter;