import mongoose from 'mongoose';

const { Schema } = mongoose;

const QuestionTypeSchema = new Schema(
  {
    qbs_qs_type_id: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    qbs_qs_type_name: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    marks: {
      type: Number,
      required: true,
      default: 1
    },
    subject_id: {
        type: Number,
        trim: true,
        required: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'questiontypes',
    _id: false,
  }
);

// Auto-increment qbs_qs_type_id
QuestionTypeSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.qbs_qs_type_id) {
      const lastDoc = await mongoose.models.QuestionType.findOne()
        .sort({ qbs_qs_type_id: -1 })
        .exec();
      this.qbs_qs_type_id = lastDoc ? lastDoc.qbs_qs_type_id + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const QuestionType = mongoose.models.QuestionType || mongoose.model('QuestionType', QuestionTypeSchema);

export default QuestionType;