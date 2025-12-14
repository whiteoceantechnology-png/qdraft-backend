/**
 * Seed Admin Script
 * Run: node scripts/seed-admin.js
 */

import '../src/models/index.js';
import { connectDB, closeConnection } from '../src/config/database.js';
import { seedAdminUser } from '../src/seeds/user.seed.js';

async function main() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('\\nSeeding admin user...');
    const result = await seedAdminUser();
    
    console.log('\\n╔══════════════════════════════════════════╗');
    console.log('║  Admin User Created Successfully! 🎉     ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  Tenant: ' + result.tenant.tenant_name.padEnd(32) + '║');
    console.log('║  Code:   ' + result.tenant.tenant_code.padEnd(32) + '║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  Username: admin                         ║');
    console.log('║  Password: admin123                      ║');
    console.log('╚══════════════════════════════════════════╝');
    
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
