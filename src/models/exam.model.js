/**
 * Exam Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Exam extends Model {}

Exam.init(
  {
    qbs_exam_id: {
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
    // UI and form related fields (stored as JSON)
    showFields: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    formData: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    headerContent: {
      type: DataTypes.TEXT('long'),
      defaultValue: '',
    },
    footerContent: {
      type: DataTypes.TEXT('long'),
      defaultValue: '',
    },
    editorContents: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    selectedQueType: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // Patterns and questions stored as JSON arrays
    patterns: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    questions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    meta: {
      type: DataTypes.JSON,
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
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['created_by'] },
      { fields: ['qbs_chapter_id'] },
      { fields: ['tenant_id', 'created_by'] },
    ],
  }
);

export default Exam;
