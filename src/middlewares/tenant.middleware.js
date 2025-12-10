/**
 * Tenant Middleware
 * Extracts tenant_id from JWT token and attaches to request
 * Provides tenant context for all database queries
 */

import HTTPStatus from 'http-status';
import { Tenant } from '../models/index.js';

/**
 * Middleware to attach tenant context from authenticated user
 * Should be used after authJwt middleware
 */
export const tenantContext = async (req, res, next) => {
  try {
    // User should be attached by authJwt middleware
    if (!req.user) {
      // If no user, just continue - tenantId will be undefined
      // This allows routes to optionally use tenant context
      req.tenantId = null;
      return next();
    }

    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      req.tenantId = null;
      return next();
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findOne({
      where: { tenant_id: tenantId, is_active: true },
    });

    if (!tenant) {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Tenant not found or inactive',
      });
    }

    // Attach tenant info to request
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (err) {
    err.status = HTTPStatus.INTERNAL_SERVER_ERROR;
    return next(err);
  }
};

/**
 * Middleware that requires tenant context (fails if no tenant)
 */
export const requireTenant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.tenant_id) {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Tenant context required',
      });
    }

    const tenantId = req.user.tenant_id;

    // Verify tenant exists and is active
    const tenant = await Tenant.findOne({
      where: { tenant_id: tenantId, is_active: true },
    });

    if (!tenant) {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Tenant not found or inactive',
      });
    }

    // Attach tenant info to request
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (err) {
    err.status = HTTPStatus.INTERNAL_SERVER_ERROR;
    return next(err);
  }
};

/**
 * Middleware to check if user is tenant admin
 */
export const requireTenantAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTPStatus.UNAUTHORIZED).json({
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
    return res.status(HTTPStatus.FORBIDDEN).json({
      message: 'Tenant admin access required',
    });
  }

  next();
};

/**
 * Middleware to check if user is super admin (platform level)
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTPStatus.UNAUTHORIZED).json({
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(HTTPStatus.FORBIDDEN).json({
      message: 'Super admin access required',
    });
  }

  next();
};

/**
 * Helper function to add tenant filter to Sequelize queries
 * Usage: Model.findAll({ where: { ...tenantFilter(req), ...otherFilters } })
 */
export const tenantFilter = (req) => {
  return { tenant_id: req.tenantId };
};

/**
 * Helper function to add tenant_id to create/update data
 * Usage: Model.create({ ...tenantData(req), ...otherData })
 */
export const tenantData = (req) => {
  return { tenant_id: req.tenantId };
};

/**
 * Scope generator for tenant-filtered queries
 * Can be used with Sequelize scopes
 */
export const createTenantScope = (tenantId) => ({
  where: { tenant_id: tenantId },
});

export default {
  tenantContext,
  requireTenant,
  requireTenantAdmin,
  requireSuperAdmin,
  tenantFilter,
  tenantData,
  createTenantScope,
};
