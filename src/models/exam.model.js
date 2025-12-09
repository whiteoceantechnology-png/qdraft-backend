import mongoose from 'mongoose';

const { Schema } = mongoose;

const ExamPatternSchema = new Schema(
  {
    qbs_ptn_id: { type: Number, required: true, ref: 'Pattern' },
    qbs_ptn_name: { type: String },
    // optional weight or marks allocation for this pattern within the exam
    weight: { type: Number, default: 0 }
  },
  { _id: false, versionKey: false }
);

const ExamQuestionSchema = new Schema(
  {
    qbs_qst_id: { type: Number, required: true, ref: 'Question'},
    qbs_qst_type: { type: Number },
    marks: { type: Number, default: 0 }
  },
  { _id: false, versionKey: false }
);

const ExamSchema = new Schema(
  {
    qbs_exam_id: { type: Number, unique: true, index: true,primaryKey:true },
    qbs_exam_name: { type: String, required: true, trim: true },
    qbs_exam_added: { type: Date, default: Date.now },
    trial_user_id: { type: Number, default: null, ref: 'User' },
    qbs_chapter_id: { type: Number, ref: 'Chapter' },
    // UI and form related fields
    showFields: { type: Schema.Types.Mixed, default: {} },
    formData: { type: Schema.Types.Mixed, default: {} },
    headerContent: { type: String, default: '' },
    footerContent: { type: String, default: '' },
    editorContents: { type: Schema.Types.Mixed, default: {} },
    selectedQueType: { type: [Number], default: [] },
    // raw question data as provided in payload (keeps original question objects)
    // queData: { type: [Schema.Types.Mixed], default: [] },
    patterns: { type: [ExamPatternSchema], default: [] },
    questions: { type: [ExamQuestionSchema], default: [] },
    meta: { type: Schema.Types.Mixed, default: {} },
    created_by: { type: Number, required: true , ref: 'User'},
    updated_by: { type: Number, required: true , ref: 'User' },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'exams',
  }
);

// Auto-increment qbs_exam_id on create
ExamSchema.pre('save', async function (next) {
  try {
    if (this.isNew && (this.qbs_exam_id == null)) {
      const last = await mongoose.models.Exam.findOne().sort('-qbs_exam_id').select('qbs_exam_id').lean().exec();
      this.qbs_exam_id = last && last.qbs_exam_id ? last.qbs_exam_id + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
export default Exam;
