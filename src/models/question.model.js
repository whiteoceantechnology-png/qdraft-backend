import mongoose from 'mongoose';

const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    option_id: {
      type: Number,
      required: true
    },
    option_text: {
      type: String,
      default: ''
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

const QuestionSchema = new Schema(
  {
    qbs_question_id: {
      type: Number,
      unique: true,
      index: true,
    },
    qbs_qst_type_id: {
      type: Number,
      required: false,
      ref: 'QuestionType'
    },
    qbs_qst_type: {
      type: String,
      required: true,
    },
    qbs_questions: {
      type: String,
      required: true,
      trim: true
    },
    qbs_qst_mark: {
      type: Number,
      required: false,
      min: 0
    },
    //answer
    qbs_solution: {
      type: String,
      default: ''
    },
    //for MCQ correct answer
    qbs_correct_answer: {
      type: String,
      default: ''
    },
    qbs_dept_id: {
      type: Number,
      required: true
    },
    qbs_sub_id: {
      type: Number,
      required: true
    },
    qbs_chapter_id: {
      type: Number,
      required: true,
      ref: 'Chapter'
    },
    qst_group_status: {
      type: Number,
      default: 0
    },
    qst_parent_id: {
      type: Number,
      default: 0
    },
    qbs_required_status: {
      type: Number,
      default: 0
    },
    qbs_previously_asked_status: {
      type: Number,
      default: 0
    },
    qbs_previously_asked_year: {
      type: String,
      default: null
    },
    qbs_question_status: {
      type: Number,
      default: 0
    },
    qbs_question_added_by: {
      type: Number,
      required: true
    },
    qbs_question_added: {
      type: Date,
      default: Date.now
    },
    qbs_question_modified_by: {
      type: Number
    },
    qbs_qst_medium: {
      type: Number,
      default: 1
    },
    qbs_qst_status: {
      type: Number,
      default: 1
    },
    previous_year_status: {
      type: Number,
      default: 0
    },
    parent_qst_status: {
      type: Number,
      default: 1
    },
    pageno: {
      type: String
    },
    qbs_creative: {
      type: Number,
      default: 0
    },
    access_level: {
      type: Number,
      default: 1
    },
    pta: {
      type: Number,
      default: 0
    },
    medium_relation_id: {
      type: Number,
      default: 0
    },
    newptn: {
      type: Number,
      default: 0
    },
    oti: {
      type: Number,
      default: 0
    },
    qcl_user: {
      type: Number,
      default: 0
    },
    qcl_user_comments: {
      type: String,
      default: ''
    },
    g_users_qcount: {
      type: Number,
      default: 0
    },
    book_back_order: {
      type: Number,
      default: 0
    },
    options: [{
      qbs_opt_id: {
        type: Number,
        required: true
      },
      qbs_option_code: String,
      qbs_option: {
        type: String,
        required: true
      },
      qbs_answer_status: {
        type: Number,
        default: 0
      },
      copy_status: {
        type: Number,
        default: null
      }
    }]
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'questions'
  }
);

// Modify the pre-save hook
QuestionSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.qbs_question_id) {
      const lastDoc = await this.constructor.findOne()
        .sort('-qbs_question_id')
        .select('qbs_question_id')
        .lean()
        .exec();
      
      const nextId = lastDoc ? lastDoc.qbs_question_id + 1 : 1;
      this.qbs_question_id = nextId;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Updated indexes
QuestionSchema.index({ qbs_chapter_id: 1 });
QuestionSchema.index({ qbs_question_category: 1 });

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

export default Question;