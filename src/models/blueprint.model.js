/**
 * Blueprint Model - Sequelize for MariaDB
 * Multi-tenant support with tenant_id
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Blueprint extends Model {}

Blueprint.init(
  {
    qbs_blp_id: {
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
    qbs_blp_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    qbs_blp_added_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_blp_dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_sub_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qbs_creative: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    qbs_blp_added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Blueprint marks stored as JSON array
    blueprint_marks: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Blueprint',
    tableName: 'blueprints',
    timestamps: false,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['qbs_blp_added_by'] },
      { fields: ['qbs_sub_id'] },
      { fields: ['tenant_id', 'qbs_blp_added_by'] },
    ],
  }
);

export default Blueprint;
