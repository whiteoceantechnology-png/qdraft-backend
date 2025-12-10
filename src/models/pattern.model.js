/**
 * Pattern Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Pattern extends Model {}

Pattern.init(
  {
    qbs_ptn_id: {
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
    qbs_ptn_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    qbs_chapter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_mark: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sub_notes: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    // Store questions array as JSON
    qbs_ptn_questions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    qbs_ptn_added_by: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_ptn_added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Pattern',
    tableName: 'patterns',
    timestamps: false,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['qbs_chapter_id'] },
      { fields: ['tenant_id', 'qbs_chapter_id'] },
    ],
  }
);

export default Pattern;
