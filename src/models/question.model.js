/**
 * Question Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Question extends Model {}

Question.init(
  {
    qbs_question_id: {
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
    qbs_qst_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    qbs_qst_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    qbs_questions: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    qbs_qst_mark: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    qbs_solution: {
      type: DataTypes.TEXT('long'),
      defaultValue: '',
    },
    qbs_correct_answer: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    qbs_dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_sub_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_chapter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qst_group_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qst_parent_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_required_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_previously_asked_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_previously_asked_year: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    qbs_question_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_question_added_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_question_added: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    qbs_question_modified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    qbs_qst_medium: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    qbs_qst_status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    previous_year_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    parent_qst_status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    pageno: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    qbs_creative: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    access_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    pta: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    medium_relation_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    newptn: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    oti: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qcl_user: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qcl_user_comments: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    g_users_qcount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    book_back_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Store options as JSON array
    options: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Question',
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['qbs_chapter_id'] },
      { fields: ['qbs_sub_id'] },
      { fields: ['qbs_dept_id'] },
      { fields: ['qbs_qst_type_id'] },
      { fields: ['tenant_id', 'qbs_chapter_id'] },
    ],
  }
);

export default Question;
