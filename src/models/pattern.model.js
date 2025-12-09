import mongoose from 'mongoose';

const { Schema } = mongoose;

const PatternQuestionSchema = new Schema(
  {
    qbs_qst_id: { type: Number, required: true },
    qbs_qst_type: { type: Number, required: true },
  },
  { _id: false, versionKey: false }
);

const PatternSchema = new Schema(
  {
    qbs_ptn_id: { type: Number, unique: true, index: true },
    qbs_ptn_name: { type: String, required: true, trim: true },
    qbs_chapter_id: { type: Number, required: true, ref: 'Chapter' },
    total_mark: { type: Number, required: true },
    sub_notes: { type: Schema.Types.Mixed, default: {} },
    qbs_ptn_questions: { type: [PatternQuestionSchema], default: [] },
    qbs_ptn_added_by: { type: Number, default: 0 },
    qbs_ptn_added_at: { type: Date, default: Date.now }
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'patterns'
  }
);

// Auto-increment qbs_ptn_id
PatternSchema.pre('save', async function (next) {
  try {
    if (this.isNew && !this.qbs_ptn_id) {
      const last = await mongoose.models.Pattern.findOne().sort('-qbs_ptn_id').select('qbs_ptn_id').lean().exec();
      this.qbs_ptn_id = last && last.qbs_ptn_id ? last.qbs_ptn_id + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Pattern = mongoose.models.Pattern || mongoose.model('Pattern', PatternSchema);
export default Pattern;
