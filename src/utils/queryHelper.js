/**
 * Pagination & Query Helper
 * Standardized pagination, filtering, and sorting for all APIs
 */

/**
 * Parse pagination parameters from request
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default values
 * @returns {Object} Pagination params
 */
export function parsePagination(query, defaults = {}) {
  const {
    page = 1,
    limit = defaults.limit || 20,
    sortBy = defaults.sortBy || 'created_at',
    sortOrder = defaults.sortOrder || 'DESC',
  } = query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset,
    order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
  };
}

/**
 * Format paginated response
 * @param {Array} data - Query results
 * @param {number} total - Total count
 * @param {Object} pagination - Pagination params
 * @returns {Object} Formatted response
 */
export function paginatedResponse(data, total, pagination) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Build Sequelize where clause from query filters
 * @param {Object} query - Request query object
 * @param {Object} allowedFilters - Map of allowed filter fields
 * @param {Object} tenantFilter - Tenant filter to include
 * @returns {Object} Sequelize where clause
 */
export function buildWhereClause(query, allowedFilters, tenantFilter = {}) {
  const where = { ...tenantFilter };

  for (const [queryKey, config] of Object.entries(allowedFilters)) {
    if (query[queryKey] !== undefined && query[queryKey] !== '') {
      const { field = queryKey, type = 'exact', transform } = config;
      let value = query[queryKey];

      // Apply transformation if provided
      if (transform) {
        value = transform(value);
      }

      // Apply filter based on type
      switch (type) {
        case 'exact':
          where[field] = value;
          break;
        case 'number':
          where[field] = Number(value);
          break;
        case 'boolean':
          where[field] = value === 'true' || value === '1';
          break;
        case 'like':
          where[field] = { [Op.like]: `%${value}%` };
          break;
        case 'array':
          where[field] = { [Op.in]: Array.isArray(value) ? value : [value] };
          break;
        default:
          where[field] = value;
      }
    }
  }

  return where;
}

/**
 * API Response helper - standardized response format
 */
export const ApiResponse = {
  success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  },

  error(res, message = 'Error', statusCode = 400, code = 'ERROR', details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    });
  },

  notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, 'NOT_FOUND');
  },

  unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  },

  forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403, 'FORBIDDEN');
  },

  validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
  },

  serverError(res, message = 'Internal server error') {
    return this.error(res, message, 500, 'SERVER_ERROR');
  },

  paginated(res, data, total, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      ...paginatedResponse(data, total, pagination),
      timestamp: new Date().toISOString(),
    });
  },
};

// Import Op for buildWhereClause
import { Op } from 'sequelize';

export default {
  parsePagination,
  paginatedResponse,
  buildWhereClause,
  ApiResponse,
};
