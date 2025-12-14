/**
 * Test Database Configuration
 * SQLite in-memory for fast, isolated testing
 */
import { Sequelize } from 'sequelize';

// Create test database instance (SQLite in-memory for speed)
const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

/**
 * Initialize test database with all models
 */
export async function initTestDatabase() {
  try {
    await testSequelize.authenticate();
    await testSequelize.sync({ force: true });
    return testSequelize;
  } catch (error) {
    console.error('Test database initialization failed:', error);
    throw error;
  }
}

/**
 * Close test database connection
 */
export async function closeTestDatabase() {
  try {
    await testSequelize.close();
  } catch (error) {
    console.error('Error closing test database:', error);
  }
}

/**
 * Clear all tables in test database
 */
export async function clearTestDatabase() {
  const models = Object.values(testSequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
}

export { testSequelize };
export default testSequelize;
