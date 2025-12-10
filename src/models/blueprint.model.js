/**
 * Blueprint Model - Sequelize for MariaDB
 */

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Blueprint extends Model {}

Blueprint.init(
  {
    qbs_blp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    // Store blueprint marks as JSON array
    blueprint_marks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Blueprint',
    tableName: 'blueprints',
    timestamps: false,
    indexes: [
      { fields: ['qbs_blp_added_by'] },
      { fields: ['qbs_blp_dept_id'] },
    ],
  }
);

export default Blueprint;