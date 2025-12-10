/**
 * Seed Controller - Sequelize for MariaDB
 * Multi-tenant support
 */

import HTTPStatus from 'http-status';
import { faker } from '@faker-js/faker';
import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
import Question from '../models/question.model.js';
import Chapter from '../models/chapter.model.js';
import Pattern from '../models/pattern.model.js';
import Exam from '../models/exam.model.js';
import Blueprint from '../models/blueprint.model.js';
import QuestionType from '../models/questiontype.model.js';
import Post from '../models/post.model.js';

/**
 * GET /api/seeds/clear
 * Clear all data (super admin only)
 * In multi-tenant system, this should be protected
 */
export async function clearAll(req, res, next) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Seed operations not allowed in production',
      });
    }

    // Clear all tables (in order due to foreign keys)
    await Post.destroy({ where: {}, truncate: { cascade: true } });
    await Question.destroy({ where: {}, truncate: { cascade: true } });
    await Exam.destroy({ where: {}, truncate: { cascade: true } });
    await Blueprint.destroy({ where: {}, truncate: { cascade: true } });
    await Chapter.destroy({ where: {}, truncate: { cascade: true } });
    await Pattern.destroy({ where: {}, truncate: { cascade: true } });
    await QuestionType.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });
    await Tenant.destroy({ where: {}, truncate: { cascade: true } });

    return res.status(HTTPStatus.OK).json({
      message: 'All data cleared successfully',
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/seeds/users/clear
 * Clear all seed users (for a tenant if tenantId provided)
 */
export async function clearSeedUsers(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Seed operations not allowed in production',
      });
    }

    const whereClause = {};
    
    // If tenant context is available, only clear for that tenant
    if (req.tenantId) {
      whereClause.tenant_id = req.tenantId;
    }

    // Only delete users with role 'user' (keep admins)
    whereClause.role = 'user';

    const deletedCount = await User.destroy({ where: whereClause });

    return res.status(HTTPStatus.OK).json({
      message: `${deletedCount} seed users cleared`,
      count: deletedCount,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * GET /api/seeds/users/:count?
 * Create seed users for a tenant
 */
export async function seedUsers(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Seed operations not allowed in production',
      });
    }

    const count = parseInt(req.params.count, 10) || 10;
    let tenantId = req.tenantId;

    // If no tenant context, create a default tenant
    if (!tenantId) {
      let tenant = await Tenant.findOne({ where: { tenant_code: 'SEED' } });
      
      if (!tenant) {
        tenant = await Tenant.create({
          tenant_name: 'Seed Tenant',
          tenant_code: 'SEED',
          is_active: true,
          subscription_plan: 'basic',
        });
      }
      
      tenantId = tenant.tenant_id;
    }

    const users = [];

    for (let i = 0; i < count; i++) {
      const fakeUser = {
        tenant_id: tenantId,
        username: faker.internet.userName() + '_' + Date.now() + i,
        email: `seed_${i}_${Date.now()}@${faker.internet.domainName()}`,
        password: 'password1',
        mobile_number: faker.phone.number(),
        user_fname: faker.person.firstName(),
        school_name: faker.company.name(),
        setup_id: faker.number.int({ min: 100, max: 999 }),
        board: faker.helpers.arrayElement(['CBSE', 'ICSE', 'State Board']),
        class_name: faker.helpers.arrayElement(['10th', '11th', '12th']),
        dept_id: faker.number.int({ min: 1, max: 20 }),
        subject: faker.helpers.arrayElement(['Math', 'Science', 'History']),
        subject_id: faker.number.int({ min: 1, max: 50 }),
        medium: faker.helpers.arrayElement([1, 2]),
        role: 'user',
      };
      users.push(fakeUser);
    }

    const createdUsers = await User.bulkCreate(users, { individualHooks: true });

    return res.status(HTTPStatus.CREATED).json({
      message: `${count} users seeded successfully`,
      count: createdUsers.length,
      tenant_id: tenantId,
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

/**
 * POST /api/seeds/tenant
 * Create a new tenant with admin user
 */
export async function seedTenant(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(HTTPStatus.FORBIDDEN).json({
        message: 'Seed operations not allowed in production',
      });
    }

    const { tenant_name, admin_email, admin_password } = req.body;

    // Generate tenant code
    const tenantCode = tenant_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) + '_' + Date.now().toString().slice(-4);

    // Create tenant
    const tenant = await Tenant.create({
      tenant_name: tenant_name || 'New Tenant',
      tenant_code: tenantCode,
      is_active: true,
      subscription_plan: 'basic',
      features: JSON.stringify(['questions', 'exams', 'blueprints']),
    });

    // Create admin user for tenant
    const adminUser = await User.create({
      tenant_id: tenant.tenant_id,
      username: 'admin_' + tenantCode.toLowerCase(),
      email: admin_email || `admin@${tenantCode.toLowerCase()}.local`,
      password: admin_password || 'Admin@123',
      user_fname: 'Admin',
      role: 'tenant_admin',
    });

    return res.status(HTTPStatus.CREATED).json({
      message: 'Tenant created successfully',
      tenant: {
        tenant_id: tenant.tenant_id,
        tenant_name: tenant.tenant_name,
        tenant_code: tenant.tenant_code,
      },
      admin: {
        user_id: adminUser.user_id,
        username: adminUser.username,
        email: adminUser.email,
      },
    });
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}
