/**
 * Test Data Factories
 * Generate realistic test data for all models
 */
import { faker } from '@faker-js/faker';

/**
 * Generate a test tenant
 */
export function createTenant(overrides = {}) {
  return {
    name: faker.company.name(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    is_active: true,
    settings: JSON.stringify({ theme: 'default' }),
    ...overrides,
  };
}

/**
 * Generate a test user
 */
export function createUser(overrides = {}) {
  return {
    email: faker.internet.email().toLowerCase(),
    username: faker.internet.userName().toLowerCase(),
    password: 'TestPassword123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'user',
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test chapter
 */
export function createChapter(overrides = {}) {
  return {
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    order: faker.number.int({ min: 1, max: 100 }),
    is_active: true,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test question type
 */
export function createQuestionType(overrides = {}) {
  return {
    name: faker.helpers.arrayElement(['MCQ', 'True/False', 'Fill in Blank', 'Essay']),
    code: faker.string.alphanumeric(4).toUpperCase(),
    description: faker.lorem.sentence(),
    is_active: true,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test question
 */
export function createQuestion(overrides = {}) {
  return {
    question_text: faker.lorem.sentence() + '?',
    option_a: faker.lorem.words(3),
    option_b: faker.lorem.words(3),
    option_c: faker.lorem.words(3),
    option_d: faker.lorem.words(3),
    correct_answer: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
    explanation: faker.lorem.paragraph(),
    difficulty: faker.helpers.arrayElement(['easy', 'medium', 'hard']),
    marks: faker.number.int({ min: 1, max: 10 }),
    is_active: true,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test pattern
 */
export function createPattern(overrides = {}) {
  return {
    name: faker.lorem.words(2) + ' Pattern',
    description: faker.lorem.sentence(),
    total_questions: faker.number.int({ min: 10, max: 100 }),
    total_marks: faker.number.int({ min: 50, max: 200 }),
    duration_minutes: faker.number.int({ min: 30, max: 180 }),
    is_active: true,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test blueprint
 */
export function createBlueprint(overrides = {}) {
  return {
    name: faker.lorem.words(3) + ' Blueprint',
    description: faker.lorem.sentence(),
    is_active: true,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate a test exam
 */
export function createExam(overrides = {}) {
  return {
    name: faker.lorem.words(2) + ' Exam',
    description: faker.lorem.sentence(),
    start_date: faker.date.future(),
    end_date: faker.date.future({ years: 1 }),
    duration_minutes: faker.number.int({ min: 30, max: 180 }),
    total_marks: faker.number.int({ min: 50, max: 200 }),
    passing_marks: faker.number.int({ min: 20, max: 100 }),
    is_active: true,
    is_published: false,
    tenant_id: 1,
    ...overrides,
  };
}

/**
 * Generate multiple items
 */
export function createMany(factory, count = 5, overrides = {}) {
  return Array.from({ length: count }, (_, index) => 
    factory({ ...overrides, _index: index })
  );
}

export default {
  createTenant,
  createUser,
  createChapter,
  createQuestionType,
  createQuestion,
  createPattern,
  createBlueprint,
  createExam,
  createMany,
};
