/**
 * Tenant Schema Verification Script
 * Checks and displays tenant_id implementation across all tables
 * Run with: node scripts/verify-tenant-schema.js
 */

import { sequelize } from '../src/config/database.js';
import chalk from 'chalk';

const TENANT_TABLES = [
  'users',
  'chapters',
  'questions',
  'question_types',
  'patterns',
  'blueprints',
  'exams',
  'posts',
];

async function checkTableStructure(tableName) {
  console.log(chalk.blue(`\n📋 Table: ${tableName}`));
  console.log('─'.repeat(60));
  
  try {
    // Get table structure
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable(tableName);
    
    // Check tenant_id column
    if (columns.tenant_id) {
      console.log(chalk.green('  ✓ tenant_id column exists'));
      console.log(`    Type: ${columns.tenant_id.type}`);
      console.log(`    Null: ${columns.tenant_id.allowNull}`);
      console.log(`    Default: ${columns.tenant_id.defaultValue || 'none'}`);
    } else {
      console.log(chalk.red('  ✗ tenant_id column MISSING'));
      return false;
    }
    
    // Check indexes
    const indexes = await queryInterface.showIndex(tableName);
    const tenantIndexes = indexes.filter(idx => 
      idx.fields.some(f => f.attribute === 'tenant_id')
    );
    
    if (tenantIndexes.length > 0) {
      console.log(chalk.green(`  ✓ ${tenantIndexes.length} index(es) on tenant_id`));
      tenantIndexes.forEach(idx => {
        const fields = idx.fields.map(f => f.attribute).join(', ');
        const unique = idx.unique ? ' (UNIQUE)' : '';
        console.log(chalk.gray(`    - ${idx.name}: (${fields})${unique}`));
      });
    } else {
      console.log(chalk.yellow('  ⚠ No index on tenant_id'));
    }
    
    // Check foreign key constraints
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = '${tableName}'
        AND COLUMN_NAME = 'tenant_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (foreignKeys.length > 0) {
      console.log(chalk.green('  ✓ Foreign key constraint exists'));
      foreignKeys.forEach(fk => {
        console.log(chalk.gray(`    ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`));
      });
    } else {
      console.log(chalk.yellow('  ⚠ No foreign key constraint (may be SQLite)'));
    }
    
    // Count records per tenant
    const [counts] = await sequelize.query(`
      SELECT tenant_id, COUNT(*) as count
      FROM ${tableName}
      GROUP BY tenant_id
      ORDER BY tenant_id
    `);
    
    if (counts.length > 0) {
      console.log(chalk.cyan('  📊 Records per tenant:'));
      counts.forEach(row => {
        console.log(chalk.gray(`    Tenant ${row.tenant_id}: ${row.count} record(s)`));
      });
    } else {
      console.log(chalk.gray('  📊 No records in table'));
    }
    
    return true;
    
  } catch (err) {
    console.log(chalk.red(`  ✗ Error: ${err.message}`));
    return false;
  }
}

async function checkTenantTable() {
  console.log(chalk.bold.blue('\n\n📦 Master Table: tenants'));
  console.log('═'.repeat(60));
  
  try {
    const [tenants] = await sequelize.query('SELECT * FROM tenants');
    
    if (tenants.length > 0) {
      console.log(chalk.green(`  ✓ ${tenants.length} tenant(s) found\n`));
      
      tenants.forEach(tenant => {
        const status = tenant.is_active ? chalk.green('ACTIVE') : chalk.red('INACTIVE');
        console.log(`  ${chalk.bold(tenant.tenant_id)}: ${tenant.tenant_name} (${tenant.tenant_code})`);
        console.log(`     Email: ${tenant.email}`);
        console.log(`     Plan: ${tenant.subscription_plan || 'N/A'}`);
        console.log(`     Status: ${status}`);
        console.log(`     Max Users: ${tenant.max_users || 'Unlimited'}`);
        console.log();
      });
    } else {
      console.log(chalk.yellow('  ⚠ No tenants found'));
    }
    
  } catch (err) {
    console.log(chalk.red(`  ✗ Error: ${err.message}`));
  }
}

async function generateSummary(results) {
  console.log(chalk.bold.yellow('\n\n📊 SUMMARY'));
  console.log('═'.repeat(60));
  
  const total = results.length;
  const passed = results.filter(r => r.status).length;
  const failed = total - passed;
  
  console.log(`  Total tables checked: ${total}`);
  console.log(chalk.green(`  ✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
  }
  
  console.log('\n' + chalk.bold('Table Status:'));
  results.forEach(result => {
    const icon = result.status ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${icon} ${result.table}`);
  });
  
  // Overall status
  if (failed === 0) {
    console.log(chalk.bold.green('\n  🎉 All tables are properly configured for multi-tenancy!'));
  } else {
    console.log(chalk.bold.red('\n  ⚠️  Some tables need attention. Run: npm run migrate:tenant'));
  }
  
  // Additional stats
  try {
    const [totalRecords] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) +
        (SELECT COUNT(*) FROM chapters) +
        (SELECT COUNT(*) FROM questions) +
        (SELECT COUNT(*) FROM question_types) +
        (SELECT COUNT(*) FROM patterns) +
        (SELECT COUNT(*) FROM blueprints) +
        (SELECT COUNT(*) FROM exams) +
        (SELECT COUNT(*) FROM posts) as total
    `);
    
    console.log(chalk.cyan(`\n  📈 Total records across all tables: ${totalRecords[0].total}`));
  } catch (err) {
    // Ignore if tables don't exist yet
  }
}

async function run() {
  console.log(chalk.bold.cyan('\n┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.bold.cyan('│     MULTI-TENANT SCHEMA VERIFICATION TOOL               │'));
  console.log(chalk.bold.cyan('└─────────────────────────────────────────────────────────┘'));
  
  console.log('\nDatabase:', chalk.yellow(sequelize.config.database || 'SQLite'));
  console.log('Host:', chalk.yellow(sequelize.config.host || 'local'));
  console.log('Dialect:', chalk.yellow(sequelize.config.dialect));
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log(chalk.green('✓ Database connection successful\n'));
    
    // Check master tenant table
    await checkTenantTable();
    
    // Check all tenant-linked tables
    const results = [];
    for (const table of TENANT_TABLES) {
      const status = await checkTableStructure(table);
      results.push({ table, status });
    }
    
    // Generate summary
    await generateSummary(results);
    
    console.log(chalk.gray('\n' + '─'.repeat(60)));
    console.log(chalk.gray('Run') + chalk.cyan(' npm run migrate:tenant ') + chalk.gray('to fix any issues'));
    console.log(chalk.gray('─'.repeat(60) + '\n'));
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    console.error(chalk.gray('\nMake sure the database is running and accessible.'));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export default run;
