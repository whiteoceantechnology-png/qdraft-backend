/**
 * QuestionType Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class QuestionType extends Model {}

QuestionType.init(
  {
    qbs_qs_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qbs_qs_type_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'QuestionType',
    tableName: 'question_types',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
);

export default QuestionType;