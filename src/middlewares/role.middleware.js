/**
 * Role-based authorization middleware
 * Enforces role hierarchy and permissions
 */

/**
 * Check if user has required role
 * @param {Array<string>} allowedRoles - Array of roles allowed to access
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

/**
 * Super admin only middleware
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Tenant admin or super admin middleware
 */
export const requireTenantAdmin = requireRole(['super_admin', 'tenant_admin']);

/**
 * Teacher, tenant admin, or super admin middleware
 */
export const requireTeacher = requireRole(['super_admin', 'tenant_admin', 'teacher']);

/**
 * Any authenticated user
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
};
