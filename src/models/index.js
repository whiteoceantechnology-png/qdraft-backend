/**
 * Models Index - Sequelize Associations
 * Multi-tenant architecture
 */

import { sequelize } from '../config/database.js';

// Import all models
import Tenant from './tenant.model.js';
import User from './user.model.js';
import Question from './question.model.js';
import Chapter from './chapter.model.js';
import Pattern from './pattern.model.js';
import Exam from './exam.model.js';
import Blueprint from './blueprint.model.js';
import QuestionType from './questiontype.model.js';
import Post from './post.model.js';
import Subject from './subject.model.js';

// ==========================================
// TENANT ASSOCIATIONS (One-to-Many)
// ==========================================

// Tenant -> Users
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Questions
Tenant.hasMany(Question, { foreignKey: 'tenant_id', as: 'questions' });
Question.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Chapters
Tenant.hasMany(Chapter, { foreignKey: 'tenant_id', as: 'chapters' });
Chapter.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Patterns
Tenant.hasMany(Pattern, { foreignKey: 'tenant_id', as: 'patterns' });
Pattern.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Exams
Tenant.hasMany(Exam, { foreignKey: 'tenant_id', as: 'exams' });
Exam.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Blueprints
Tenant.hasMany(Blueprint, { foreignKey: 'tenant_id', as: 'blueprints' });
Blueprint.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> QuestionTypes
Tenant.hasMany(QuestionType, { foreignKey: 'tenant_id', as: 'questionTypes' });
QuestionType.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant -> Posts
Tenant.hasMany(Post, { foreignKey: 'tenant_id', as: 'posts' });
Post.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ==========================================
// INTERNAL MODEL ASSOCIATIONS
// ==========================================

// Question -> Chapter
Chapter.hasMany(Question, { foreignKey: 'qbs_chapter_id', as: 'questions' });
Question.belongsTo(Chapter, { foreignKey: 'qbs_chapter_id', as: 'chapter' });

// Question -> QuestionType
QuestionType.hasMany(Question, { foreignKey: 'qbs_qst_type_id', as: 'questions' });
Question.belongsTo(QuestionType, { foreignKey: 'qbs_qst_type_id', as: 'questionType' });

// Question -> User (added_by)
User.hasMany(Question, { foreignKey: 'qbs_question_added_by', as: 'addedQuestions' });
Question.belongsTo(User, { foreignKey: 'qbs_question_added_by', as: 'addedBy' });

// Pattern -> Chapter
Chapter.hasMany(Pattern, { foreignKey: 'qbs_chapter_id', as: 'patterns' });
Pattern.belongsTo(Chapter, { foreignKey: 'qbs_chapter_id', as: 'chapter' });

// Pattern -> User (added_by)
User.hasMany(Pattern, { foreignKey: 'qbs_ptn_added_by', as: 'addedPatterns' });
Pattern.belongsTo(User, { foreignKey: 'qbs_ptn_added_by', as: 'addedBy' });

// Exam -> User (created_by)
User.hasMany(Exam, { foreignKey: 'created_by', as: 'createdExams' });
Exam.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Exam -> User (updated_by)
Exam.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// Exam -> Chapter
Chapter.hasMany(Exam, { foreignKey: 'qbs_chapter_id', as: 'exams' });
Exam.belongsTo(Chapter, { foreignKey: 'qbs_chapter_id', as: 'chapter' });

// Blueprint -> User (added_by)
User.hasMany(Blueprint, { foreignKey: 'qbs_blp_added_by', as: 'addedBlueprints' });
Blueprint.belongsTo(User, { foreignKey: 'qbs_blp_added_by', as: 'addedBy' });

// Post -> User (author)
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Tenant -> Subjects
Tenant.hasMany(Subject, { foreignKey: 'tenant_id', as: 'subjects' });
Subject.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Subject -> User (created_by)
User.hasMany(Subject, { foreignKey: 'created_by', as: 'createdSubjects' });
Subject.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Subject -> User (assignment)
Subject.hasMany(User, { foreignKey: 'subject_id', as: 'assignedUsers' });
User.belongsTo(Subject, { foreignKey: 'subject_id', as: 'assignedSubject' });

// ==========================================
// EXPORT ALL MODELS
// ==========================================

export {
  sequelize,
  Tenant,
  User,
  Question,
  Chapter,
  Pattern,
  Exam,
  Blueprint,
  QuestionType,
  Post,
  Subject,
};

export default {
  sequelize,
  Tenant,
  User,
  Question,
  Chapter,
  Pattern,
  Exam,
  Blueprint,
  QuestionType,
  Post,
  Subject,
};
