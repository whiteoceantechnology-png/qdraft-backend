import { faker } from '@faker-js/faker';
import { User, Tenant } from '../models/index.js';

/**
 * Seed an admin user with a default tenant
 * Creates tenant if not exists, creates admin if not exists
 */
export async function seedAdminUser() {
  try {
    // Create or find default tenant
    let tenant = await Tenant.findOne({ where: { tenant_code: 'DEFAULT' } });
    if (!tenant) {
      tenant = await Tenant.create({
        tenant_name: 'Default Organization',
        tenant_code: 'DEFAULT',
        email: 'admin@qbserver.com',
        is_active: true,
        subscription_plan: 'enterprise',
        max_users: 100,
        max_questions: 10000,
        max_exams: 500,
      });
      console.log('✓ Created default tenant');
    }

    // Create or find admin user
    let admin = await User.findOne({ 
      where: { 
        username: 'admin',
        tenant_id: tenant.tenant_id 
      } 
    });

    if (!admin) {
      admin = await User.create({
        tenant_id: tenant.tenant_id,
        username: 'admin',
        email: 'admin@qbserver.com',
        password: 'admin123',
        user_fname: 'Admin',
        role: 'super_admin',
        is_active: true,
      });
      console.log('✓ Created admin user');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log('✓ Admin user already exists');
    }

    return { tenant, admin };
  } catch (error) {
    console.error('Admin Seed Error:', error);
    throw error;
  }
}

export async function userSeed(count, tenantId = null) {
  try {
    // Get or create a default tenant for seeding
    let seedTenantId = tenantId;
    
    if (!seedTenantId) {
      let tenant = await Tenant.findOne({ where: { tenant_code: 'SEED' } });
      if (!tenant) {
        tenant = await Tenant.create({
          tenant_name: 'Seed Tenant',
          tenant_code: 'SEED',
          is_active: true,
          subscription_plan: 'basic',
        });
      }
      seedTenantId = tenant.tenant_id;
    }

    const users = [];

    for (let i = 0; i < (count || 10); i++) {
      const fakeUser = {
        tenant_id: seedTenantId,
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

    const savedUsers = await User.bulkCreate(users, { individualHooks: true });
    return savedUsers;
  } catch (error) {
    console.log('User Seed Error:', error);
    return error;
  }
}

export async function deleteUserSeed(tenantId = null) {
  try {
    const whereClause = { role: 'user' };
    if (tenantId) {
      whereClause.tenant_id = tenantId;
    }
    return await User.destroy({ where: whereClause });
  } catch (e) {
    console.log('Delete User Seed Error:', e);
    return e;
  }
}
