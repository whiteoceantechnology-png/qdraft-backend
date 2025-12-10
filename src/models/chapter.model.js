/**
 * Chapter Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Chapter extends Model {}

Chapter.init(
  {
    qbs_chapter_id: {
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
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['qbs_sub_id'] },
      { fields: ['qbs_dept_id'] },
      { fields: ['tenant_id', 'qbs_sub_id', 'qbs_dept_id'] },
    ],
  }
);

export default Chapter;
