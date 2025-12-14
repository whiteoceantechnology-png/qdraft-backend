/**
 * Tenant Controller
 * Handles CRUD operations for tenants
 */

import HTTPStatus from 'http-status';
import { Tenant, User } from '../models/index.js';
import cache, { keys, del, delPattern } from '../services/cache.js';

/**
 * Get all tenants
 * @route GET /api/tenants
 */
export async function getAllTenants(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { tenant_name: { [Op.like]: `%${search}%` } },
        { tenant_code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'users',
        attributes: ['user_id'],
      }],
    });

    // Add user count to each tenant
    const tenants = rows.map(t => ({
      ...t.toJSON(),
      userCount: t.users?.length || 0,
    }));

    res.status(HTTPStatus.OK).json({
      success: true,
      data: {
        tenants,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get tenant by ID
 * @route GET /api/tenants/:id
 */
export async function getTenantById(req, res, next) {
  try {
    const { id } = req.params;

    // Try cache first
    const cacheKey = keys.tenant(id);
    let tenant = cache.get(cacheKey);

    if (!tenant) {
      tenant = await Tenant.findByPk(id, {
        include: [{
          model: User,
          as: 'users',
          attributes: ['user_id', 'username', 'email', 'role', 'is_active'],
        }],
      });

      if (!tenant) {
        return res.status(HTTPStatus.NOT_FOUND).json({
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: `Tenant with ID ${id} not found`,
        });
      }

      // Cache result
      cache.set(cacheKey, tenant.toJSON(), 300);
    }

    res.status(HTTPStatus.OK).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create new tenant (with optional tenant admin)
 * @route POST /api/tenants
 * @access Super Admin only
 */
export async function createTenant(req, res, next) {
  try {
    const {
      tenant_name,
      tenant_code,
      email,
      phone,
      address,
      website,
      logo_url,
      primary_color,
      secondary_color,
      subscription_plan,
      max_users,
      max_questions,
      max_exams,
      features,
      settings,
      // Optional tenant admin data
      admin_username,
      admin_email,
      admin_password,
      admin_name,
    } = req.body;

    // Validate required fields
    if (!tenant_name || !tenant_code) {
      return res.status(HTTPStatus.BAD_REQUEST).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'tenant_name and tenant_code are required',
      });
    }

    // Check if tenant_code already exists
    const existing = await Tenant.findOne({ where: { tenant_code } });
    if (existing) {
      return res.status(HTTPStatus.CONFLICT).json({
        success: false,
        code: 'DUPLICATE_TENANT_CODE',
        message: 'Tenant code already exists',
      });
    }

    // Create tenant
    const tenant = await Tenant.create({
      tenant_name,
      tenant_code,
      email,
      phone,
      address,
      website,
      logo_url,
      primary_color,
      secondary_color,
      subscription_plan: subscription_plan || 'free',
      max_users: max_users || 5,
      max_questions: max_questions || 1000,
      max_exams: max_exams || 100,
      features,
      settings,
      is_active: true,
    });

    let tenantAdmin = null;

    // Create tenant admin if credentials provided
    if (admin_username && admin_email && admin_password) {
      // Check if admin username already exists
      const existingAdmin = await User.findOne({
        where: {
          tenant_id: tenant.tenant_id,
          username: admin_username,
        },
      });

      if (existingAdmin) {
        // Rollback tenant creation
        await tenant.destroy();
        return res.status(HTTPStatus.CONFLICT).json({
          success: false,
          code: 'DUPLICATE_ADMIN_USERNAME',
          message: 'Admin username already exists',
        });
      }

      tenantAdmin = await User.create({
        tenant_id: tenant.tenant_id,
        username: admin_username,
        email: admin_email,
        password: admin_password,
        user_fname: admin_name || 'Admin',
        role: 'tenant_admin',
        is_active: true,
      });
    }

    const response = {
      success: true,
      message: tenantAdmin
        ? 'Tenant and admin created successfully'
        : 'Tenant created successfully',
      data: {
        tenant,
        ...(tenantAdmin && {
          admin: {
            user_id: tenantAdmin.user_id,
            username: tenantAdmin.username,
            email: tenantAdmin.email,
            role: tenantAdmin.role,
          },
        }),
      },
    };

    res.status(HTTPStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * Update tenant
 * @route PUT /api/tenants/:id
 */
export async function updateTenant(req, res, next) {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: `Tenant with ID ${id} not found`,
      });
    }

    // Check for duplicate tenant_code if being changed
    if (req.body.tenant_code && req.body.tenant_code !== tenant.tenant_code) {
      const existing = await Tenant.findOne({ where: { tenant_code: req.body.tenant_code } });
      if (existing) {
        return res.status(HTTPStatus.CONFLICT).json({
          success: false,
          code: 'DUPLICATE_TENANT_CODE',
          message: 'Tenant code already exists',
        });
      }
    }

    // Update fields
    const updatableFields = [
      'tenant_name', 'tenant_code', 'email', 'phone', 'address', 'website',
      'logo_url', 'favicon_url', 'primary_color', 'secondary_color',
      'subscription_plan', 'subscription_start', 'subscription_end',
      'max_users', 'max_questions', 'max_exams', 'features', 'settings', 'is_active',
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        tenant[field] = req.body[field];
      }
    });

    await tenant.save();

    // Invalidate cache
    del(keys.tenant(id));

    res.status(HTTPStatus.OK).json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete tenant
 * @route DELETE /api/tenants/:id
 */
export async function deleteTenant(req, res, next) {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: `Tenant with ID ${id} not found`,
      });
    }

    // Check if tenant has users
    const userCount = await User.count({ where: { tenant_id: id } });
    if (userCount > 0) {
      return res.status(HTTPStatus.CONFLICT).json({
        success: false,
        code: 'TENANT_HAS_USERS',
        message: `Cannot delete tenant with ${userCount} active users. Delete users first.`,
      });
    }

    await tenant.destroy();

    // Invalidate cache
    del(keys.tenant(id));
    delPattern(`*:${id}:*`);

    res.status(HTTPStatus.OK).json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
