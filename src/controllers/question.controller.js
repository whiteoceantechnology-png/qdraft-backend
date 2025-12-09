import HTTPStatus from 'http-status';
import Question from '../models/question.model.js';
import QuestionType from '../models/questionType.model.js';
import Chapter from '../models/chapter.model.js';

/**
 * GET /api/questions/search
 * Get questions with all related data (options, types, chapters, previous years)
 * Query params:
 * - qbs_chapter_id: Filter by chapter ID
 * - qbs_qst_ids[]: Array of question IDs to fetch
 */
export async function getQuestionsWithRelatedData(req, res, next) {
  try {
    const { qbs_chapter_id, qbs_qst_ids = [] } = req.query;
    
    // Build base query
    const query = {};
    if (qbs_chapter_id) {
      query.qbs_chapter_id = Number(qbs_chapter_id);
    }
    if (qbs_qst_ids.length > 0) {
      query.qbs_qst_id = { $in: qbs_qst_ids.map(Number) };
    }

    // Fetch questions
    const questions = await Question.find(query)
      .select({
        qbs_qst_id: 1,
        qbs_qst_type: 1,
        qbs_questions: 1,
        qbs_qst_mark: 1,
        qbs_solution: 1,
        qbs_dept_id: 1,
        qbs_sub_id: 1,
        qbs_chapter_id: 1,
        qbs_creative: 1,
        qbs_question_added_by: 1,
        _id: 0
      })
      .lean()
      .exec();

    // Get unique question IDs
    const questionIds = questions.map(q => q.qbs_qst_id);
    
    // Options placeholder (can be populated if Option model exists)
    const options = {};

    // Fetch all question types
    const quesTypes = await QuestionType.find()
      .select({
        qbs_qs_type_id: 1,
        marks: 1,
        qbs_qs_type_name: 1,
        _id: 0
      })
      .lean()
      .exec();

    // Add name field to match expected response
    quesTypes.forEach(type => {
      type.name = type.qbs_qs_type_name;
    });

    // Previous years placeholder
    const prevQueYears = {};

    // Fetch unique chapters
    const uniqueChapterIds = [...new Set(questions.map(q => q.qbs_chapter_id))];
    const chapters = await Chapter.find({
      qbs_chapter_id: { $in: uniqueChapterIds }
    })
    .select({
      qbs_chapter_id: 1,
      qbs_chapter_name: 1,
      qbs_sub_id: 1,
      qbs_dept_id: 1,
      _id: 0
    })
    .lean()
    .exec();

    // Get exam question IDs if any exist (format as shown in example)
    const examQueIds = questions
      .filter(q => q.qbs_qst_id && q.qbs_qst_type)
      .map(q => `${q.qbs_qst_id}, ${q.qbs_qst_type}, ${q.qbs_qst_mark}, ${q.qbs_creative || 0}`);

    const response = {
      questions,
      options,
      quesTypes,
      prevQueYears,
      chapters,
      examQueIds: examQueIds.length ? [examQueIds] : [],
      userIdQ: req.user?.user_id || null
    };

    return res.status(HTTPStatus.OK).json(response);
  } catch (err) {
    err.status = HTTPStatus.BAD_REQUEST;
    return next(err);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const question = new Question({
      qbs_question_category: req.body.questionCategory,
      qbs_qst_type: req.body.questionType,
      qbs_qst_type_id: req.body.questionTypeId,
      qbs_questions: req.body.question,
      qbs_solution: req.body.answer,
      qbs_correct_answer: req.body.correctAnswer,
      options: req.body.options?.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option
      })),
      qbs_qst_mark: req.body.marks,
      qbs_chapter_id: req.body.chapterId,
      qbs_question_added_by: req.user.user_id,
      qbs_sub_id: req.user.subject_id,
      qbs_dept_id: req.user.dept_id
    });

    const savedQuestion = await question.save();

    return res.status(HTTPStatus.CREATED).json({
      message: 'Question created successfully',
      question: savedQuestion
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestions(req, res, next) {
  try {
    const { chapterId, questionType, questionCategory } = req.query;
    const query = {};

    if (chapterId) query.qbs_chapter_id = chapterId;
    if (questionType) query.qbs_qs_type_id = questionType;
    if (questionCategory) query.qbs_question_category = questionCategory;
    
    const questions = await Question.find(query)
      .sort({ createdAt: -1 }).select({ _id: 0, __v: 0 });

    return res.status(HTTPStatus.OK).json(questions);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionById(req, res, next) {
  try {
    const question = await Question.findOne({ qbs_question_id: req.params.id })
      .populate('qbs_chapter_id', 'qbs_chapter_name')
      .populate('qbs_qs_type_id', 'qbs_qs_type_name').select({ _id: 0, __v: 0 });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Question not found'
      });
    }

    return res.status(HTTPStatus.OK).json(question);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const updateData = {
      qbs_chapter_id: req.body.lesson,
      qbs_question_category: req.body.questionCategory,
      qbs_qs_type_id: req.body.questionType,
      qbs_question_text: req.body.question,
      qbs_solution: req.body.answer,
      qbs_correct_answer: req.body.correctAnswer,
      options: req.body.options?.map(opt => ({
        qbs_opt_id: opt.id,
        qbs_option: opt.option
      })),
      qbs_correct_answer: req.body.correctAnswer,
      qbs_marks: req.body.marks,
      qbs_question_type_name: req.body.chapter_id
    };

    const question = await Question.findOneAndUpdate(
      { qbs_question_id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Question not found'
      });
    }

    return res.status(HTTPStatus.OK).json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findOneAndDelete({
      qbs_question_id: req.params.id
    });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        message: 'Question not found'
      });
    }

    return res.status(HTTPStatus.OK).json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Get questions with options and related data
export async function getQuestionsWithOptions(req, res, next) {
  try {
    const { subject_id, dept_id } = req.user;
    const { selectedCounts } = req.body;
    const { chapterId } = req.params;
    const query = {};

    if (chapterId) query.qbs_chapter_id = parseInt(chapterId);
    // if (subject_id) query.qbs_sub_id = parseInt(subject_id);
    // if (dept_id) query.qbs_dept_id = parseInt(dept_id);

    // Parse selectedCounts if provided
    let typeCountMap = { ...selectedCounts };
    // if (selectedCounts) {
    //   try {
    //     typeCountMap = JSON.parse(selectedCounts);
    //   } catch (e) {
    //     console.error('Error parsing selectedCounts:', e);
    //   }
    // }

    // Get questions for each type based on selected counts
    let allQuestions = [];

    for (const [type_id, count] of Object.entries(typeCountMap)) {
      if (count > 0) {
        const Questions = await Question.aggregate([
          {
            $match: {
              ...query,
              qbs_qst_type_id: parseInt(type_id)
            }
          },
          { $sample: { size: parseInt(count) } }, // Randomly select the required number of questions
          // {
          //   $lookup: {
          //     from: 'chapters',
          //     localField: 'qbs_chapter_id',
          //     foreignField: 'qbs_chapter_id',
          //     as: 'chapter'
          //   }
          // },
          // {
          //   $lookup: {
          //     from: 'questiontypes',
          //     localField: 'qbs_qst_type',
          //     foreignField: 'qbs_qs_type_id',
          //     as: 'questionType'
          //   }
          // },
          // {
          //   $project: {
          //     _id: 0,
          //     qbs_qst_id:   1,//'$qbs_question_id',
          //     qbs_qst_type: 1, //'$qbs_qst_type',
          //     qbs_questions:1,// '$qbs_questions',
          //     qbs_qst_mark: 1, //'$qbs_qst_mark',
          //     qbs_solution: 1,//'$qbs_solution',
          //     qbs_dept_id: 1,
          //     qbs_sub_id: 1,
          //     qbs_chapter_id: 1,
          //     qst_group_status: 1,
          //     qst_parent_id: 1,
          //     qbs_required_status: 1,
          //     qbs_previously_asked_status: 1,
          //     qbs_previously_asked_year: 1,
          //     qbs_question_status: 1,
          //     qbs_question_added_by: 1,
          //     qbs_question_added: 1,
          //     qbs_question_modified_by: 1,
          //     qbs_qst_medium: 1,
          //     qbs_qst_status: 1,
          //     previous_year_status: 1,
          //     parent_qst_status: 1,
          //     pageno: 1,
          //     qbs_creative: 1,
          //     access_level: 1,
          //     pta: 1,
          //     medium_relation_id: 1,
          //     newptn: 1,
          //     oti: 1,
          //     qcl_user: 1,
          //     qcl_user_comments: 1,
          //     g_users_qcount: 1,
          //     book_back_order: 1
          //   }
          // }
        ]);
        allQuestions = [...allQuestions, ...Questions];
      }
    }

    // Get options for all selected questions
    const questionIds = allQuestions.map(q => q.qbs_qst_id);
    const options = await Question.aggregate([
      { $match: { qbs_question_id: { $in: questionIds } } },
      { $unwind: '$options' },
      {
        $project: {
          _id: 0,
          qbs_opt_id: '$options.qbs_opt_id',
          qbs_qst_id: '$qbs_question_id',
          qbs_option_code: '$options.qbs_option_code',
          qbs_option: '$options.qbs_option',
          qbs_answer_status: '$options.qbs_answer_status',
          copy_status: '$options.copy_status'
        }
      }
    ]);

    // Get question types
    const quesTypes = await QuestionType.aggregate([
      {
        $project: {
          _id: 0,
          qbs_qs_type_id: 1,
          marks: 1,
          qbs_qs_type_name: 1,
          name: 1
        }
      }
    ]);

    // Get chapters
    const chapters = await Chapter.aggregate([
      {
        $project: {
          _id: 0,
          qbs_chapter_id: 1,
          qbs_chapter_name: 1,
          qbs_sub_id: 1,
          qbs_dept_id: 1
        }
      }
    ]);

    return res.status(HTTPStatus.OK).json({
      questions: allQuestions,
      options,
      quesTypes,
      chapters
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionForQBM(req, res, next) {
  try {
    const { examName, marks, selectedChapter, selectedQueType } = req.body;
    // TODO: Implement QBM question fetching logic
    return res.status(HTTPStatus.OK).json({ examName, marks, selectedChapter, selectedQueType });
  } catch (error) {
    next(error);
  }
}