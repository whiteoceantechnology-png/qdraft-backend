/**
 * Model Index - Sequelize Models and Associations
 */

import sequelize from '../config/database.js';

// Import all models
import User from './user.model.js';
import Question from './question.model.js';
import QuestionType from './questionType.model.js';
import Chapter from './chapter.model.js';
import Pattern from './pattern.model.js';
import Blueprint from './blueprint.model.js';
import Exam from './exam.model.js';
import Post from './post.model.js';

// Define associations

// Question belongs to Chapter
Question.belongsTo(Chapter, {
  foreignKey: 'qbs_chapter_id',
  targetKey: 'qbs_chapter_id',
  as: 'chapter',
});
Chapter.hasMany(Question, {
  foreignKey: 'qbs_chapter_id',
  sourceKey: 'qbs_chapter_id',
  as: 'questions',
});

// Question belongs to QuestionType
Question.belongsTo(QuestionType, {
  foreignKey: 'qbs_qst_type_id',
  targetKey: 'qbs_qs_type_id',
  as: 'questionType',
});
QuestionType.hasMany(Question, {
  foreignKey: 'qbs_qst_type_id',
  sourceKey: 'qbs_qs_type_id',
  as: 'questions',
});

// Question added by User
Question.belongsTo(User, {
  foreignKey: 'qbs_question_added_by',
  targetKey: 'user_id',
  as: 'addedBy',
});

// Pattern belongs to Chapter
Pattern.belongsTo(Chapter, {
  foreignKey: 'qbs_chapter_id',
  targetKey: 'qbs_chapter_id',
  as: 'chapter',
});
Chapter.hasMany(Pattern, {
  foreignKey: 'qbs_chapter_id',
  sourceKey: 'qbs_chapter_id',
  as: 'patterns',
});

// Pattern added by User
Pattern.belongsTo(User, {
  foreignKey: 'qbs_ptn_added_by',
  targetKey: 'user_id',
  as: 'addedBy',
});

// Exam belongs to Chapter
Exam.belongsTo(Chapter, {
  foreignKey: 'qbs_chapter_id',
  targetKey: 'qbs_chapter_id',
  as: 'chapter',
});
Chapter.hasMany(Exam, {
  foreignKey: 'qbs_chapter_id',
  sourceKey: 'qbs_chapter_id',
  as: 'exams',
});

// Exam created/updated by User
Exam.belongsTo(User, {
  foreignKey: 'created_by',
  targetKey: 'user_id',
  as: 'creator',
});
Exam.belongsTo(User, {
  foreignKey: 'updated_by',
  targetKey: 'user_id',
  as: 'updater',
});
Exam.belongsTo(User, {
  foreignKey: 'trial_user_id',
  targetKey: 'user_id',
  as: 'trialUser',
});

// Blueprint added by User
Blueprint.belongsTo(User, {
  foreignKey: 'qbs_blp_added_by',
  targetKey: 'user_id',
  as: 'addedBy',
});

// Post belongs to User (author)
Post.belongsTo(User, {
  foreignKey: 'author',
  targetKey: 'user_id',
  as: 'authorUser',
});
User.hasMany(Post, {
  foreignKey: 'author',
  sourceKey: 'user_id',
  as: 'posts',
});

// Export all models
export {
  sequelize,
  User,
  Question,
  QuestionType,
  Chapter,
  Pattern,
  Blueprint,
  Exam,
  Post,
};

export default {
  sequelize,
  User,
  Question,
  QuestionType,
  Chapter,
  Pattern,
  Blueprint,
  Exam,
  Post,
};
