import mongoose, { Schema } from 'mongoose';

const ChapterSchema = new Schema(
  {
    qbs_chapter_id: {
      type: Number,
      unique: true,
      index: true,
      primaryKey: true,
    },
    qbs_chapter_name: {
      type: String,
      required: true,
      trim: true,
    },
    qbs_dept_id: {
      type: Number,
      required: true,
    },
    qbs_sub_id: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
    collection: 'chapters',
  },
);

// auto-increment qbs_chapter_id on create (simple approach)
ChapterSchema.pre('save', async function (next) {
  try {
    if (this.isNew && (this.qbs_chapter_id == null)) {
      const last = await mongoose.models.Chapter.findOne().sort('-qbs_chapter_id').select('qbs_chapter_id').exec();
      this.qbs_chapter_id = last && last.qbs_chapter_id ? last.qbs_chapter_id + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
export default Chapter;