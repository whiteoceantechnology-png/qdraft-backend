/**
 * Database Migration: Add tenant_id Foreign Keys
 * Ensures all tables have proper tenant_id constraints
 * Run with: node scripts/migrations/add-tenant-foreign-keys.js
 */

import { sequelize } from '../../src/config/database.js';

async function addTenantForeignKeys() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Adding tenant_id foreign key constraints...\n');
  
  try {
    // Check if constraints already exist
    const tables = [
      'users',
      'questions',
      'chapters',
      'patterns',
      'exams',
      'blueprints',
      'question_types',
      'posts',
    ];
    
    for (const table of tables) {
      try {
        console.log(`Processing table: ${table}`);
        
        // Check if column exists
        const columns = await queryInterface.describeTable(table);
        
        if (!columns.tenant_id) {
          console.log(`  ⚠️  tenant_id column missing in ${table}, adding...`);
          await queryInterface.addColumn(table, 'tenant_id', {
            type: sequelize.Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1, // Default to first tenant during migration
            references: {
              model: 'tenants',
              key: 'tenant_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT', // Prevent tenant deletion if records exist
          });
          console.log(`  ✓ Column added to ${table}`);
        } else {
          console.log(`  ✓ tenant_id column already exists in ${table}`);
        }
        
        // Add index if not exists
        const indexes = await queryInterface.showIndex(table);
        const hasTenantIndex = indexes.some(idx => 
          idx.name.includes('tenant_id') || 
          idx.fields.some(f => f.attribute === 'tenant_id')
        );
        
        if (!hasTenantIndex) {
          console.log(`  ⚠️  Adding index on tenant_id for ${table}...`);
          await queryInterface.addIndex(table, ['tenant_id'], {
            name: `${table}_tenant_id_idx`,
          });
          console.log(`  ✓ Index added to ${table}`);
        } else {
          console.log(`  ✓ Index already exists on ${table}.tenant_id`);
        }
        
      } catch (err) {
        console.error(`  ❌ Error processing ${table}:`, err.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function addCompositeIndexes() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('\n🔄 Adding composite indexes for performance...\n');
  
  const compositeIndexes = [
    // Users - tenant + email, tenant + username
    { table: 'users', fields: ['tenant_id', 'email'], name: 'users_tenant_email_idx' },
    { table: 'users', fields: ['tenant_id', 'username'], name: 'users_tenant_username_idx' },
    { table: 'users', fields: ['tenant_id', 'role'], name: 'users_tenant_role_idx' },
    
    // Questions - tenant + chapter, tenant + subject
    { table: 'questions', fields: ['tenant_id', 'qbs_chapter_id'], name: 'questions_tenant_chapter_idx' },
    { table: 'questions', fields: ['tenant_id', 'qbs_sub_id'], name: 'questions_tenant_subject_idx' },
    
    // Chapters - tenant + subject
    { table: 'chapters', fields: ['tenant_id', 'qbs_sub_id'], name: 'chapters_tenant_subject_idx' },
    { table: 'chapters', fields: ['tenant_id', 'qbs_dept_id'], name: 'chapters_tenant_dept_idx' },
    
    // Patterns - tenant + chapter
    { table: 'patterns', fields: ['tenant_id', 'qbs_chapter_id'], name: 'patterns_tenant_chapter_idx' },
    
    // Exams - tenant + chapter, tenant + user
    { table: 'exams', fields: ['tenant_id', 'qbs_chapter_id'], name: 'exams_tenant_chapter_idx' },
    { table: 'exams', fields: ['tenant_id', 'trial_user_id'], name: 'exams_tenant_user_idx' },
    
    // Blueprints - tenant + user, tenant + subject
    { table: 'blueprints', fields: ['tenant_id', 'qbs_blp_added_by'], name: 'blueprints_tenant_user_idx' },
    { table: 'blueprints', fields: ['tenant_id', 'qbs_sub_id'], name: 'blueprints_tenant_subject_idx' },
    
    // QuestionTypes - tenant + subject
    { table: 'question_types', fields: ['tenant_id', 'subject_id'], name: 'qtypes_tenant_subject_idx' },
    
    // Posts - tenant + author, tenant + slug (unique)
    { table: 'posts', fields: ['tenant_id', 'author_id'], name: 'posts_tenant_author_idx' },
    { table: 'posts', fields: ['tenant_id', 'slug'], name: 'posts_tenant_slug_idx', unique: true },
  ];
  
  for (const { table, fields, name, unique = false } of compositeIndexes) {
    try {
      const indexes = await queryInterface.showIndex(table);
      const exists = indexes.some(idx => idx.name === name);
      
      if (!exists) {
        console.log(`  Adding ${unique ? 'unique ' : ''}index ${name} on ${table}...`);
        await queryInterface.addIndex(table, fields, { name, unique });
        console.log(`  ✓ Index ${name} added`);
      } else {
        console.log(`  ✓ Index ${name} already exists`);
      }
    } catch (err) {
      console.error(`  ❌ Error adding index ${name}:`, err.message);
    }
  }
  
  console.log('\n✅ Composite indexes added successfully!');
}

async function verifyTenantIsolation() {
  console.log('\n🔍 Verifying tenant isolation...\n');
  
  const tables = [
    'users',
    'questions',
    'chapters',
    'patterns',
    'exams',
    'blueprints',
    'question_types',
    'posts',
  ];
  
  for (const table of tables) {
    try {
      const [results] = await sequelize.query(`
        SELECT COUNT(*) as total, COUNT(DISTINCT tenant_id) as tenant_count
        FROM ${table}
      `);
      
      const { total, tenant_count } = results[0];
      console.log(`  ${table}: ${total} records across ${tenant_count} tenant(s)`);
    } catch (err) {
      console.error(`  ❌ Error checking ${table}:`, err.message);
    }
  }
  
  console.log('\n✅ Verification complete!');
}

async function run() {
  try {
    console.log('🚀 Starting Tenant Isolation Migration\n');
    console.log('Database:', sequelize.config.database);
    console.log('Host:', sequelize.config.host);
    console.log('Dialect:', sequelize.config.dialect);
    console.log('='.repeat(60));
    
    await addTenantForeignKeys();
    await addCompositeIndexes();
    await verifyTenantIsolation();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All migrations completed successfully!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { addTenantForeignKeys, addCompositeIndexes, verifyTenantIsolation };
