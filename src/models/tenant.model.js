/**
 * Tenant Model - Sequelize for MariaDB
 * Multi-tenancy support
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Tenant extends Model {}

Tenant.init(
  {
    tenant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tenant_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    // Branding
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    favicon_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    primary_color: {
      type: DataTypes.STRING(20),
      defaultValue: '#1976d2',
    },
    secondary_color: {
      type: DataTypes.STRING(20),
      defaultValue: '#424242',
    },
    // Contact Info
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Subscription & Plan
    subscription_plan: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      defaultValue: 'free',
    },
    subscription_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscription_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    max_questions: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    max_exams: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    // Features flags (JSON for flexibility)
    features: {
      type: DataTypes.JSON,
      defaultValue: {
        canExportPDF: true,
        canExportWord: false,
        canUseAI: false,
        canBulkImport: false,
        canUseTemplates: true,
        maxStorage: 100, // MB
      },
    },
    // Custom settings (JSON for flexibility)
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        defaultLanguage: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        questionNumberFormat: 'numeric', // numeric, roman, alpha
      },
    },
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Tenant;
