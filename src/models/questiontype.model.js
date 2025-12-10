/**
 * QuestionType Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class QuestionType extends Model {}

QuestionType.init(
  {
    qbs_qs_type_id: {
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
    qbs_qs_type_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    marks: {
      type: DataTypes.DECIMAL(10, 2),
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
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['subject_id'] },
      { fields: ['tenant_id', 'subject_id'] },
    ],
  }
);

export default QuestionType;
