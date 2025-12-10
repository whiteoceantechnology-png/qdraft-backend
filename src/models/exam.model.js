/**
 * Exam Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Exam extends Model {}

Exam.init(
  {
    qbs_exam_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qbs_exam_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    qbs_exam_added: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    trial_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    qbs_chapter_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // UI and form related fields stored as JSON
    showFields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    formData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    headerContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      defaultValue: '',
    },
    footerContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      defaultValue: '',
    },
    editorContents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    selectedQueType: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Patterns and questions stored as JSON arrays
    patterns: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Exam',
    tableName: 'exams',
    timestamps: false,
    indexes: [
      { fields: ['qbs_chapter_id'] },
      { fields: ['trial_user_id'] },
      { fields: ['created_by'] },
    ],
  }
);

export default Exam;
