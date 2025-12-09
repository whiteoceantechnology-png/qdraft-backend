import mongoose from 'mongoose';

const { Schema } = mongoose;

const BlueprintMarkSchema = new Schema(
  {
    qbs_bmark_id: {
      type: Number,
      required: true,
      index: true,
    },
    qbs_blp_chapter_id: {
      type: Number,
      required: true,
    },
    qbs_blp_mark: {
      type: Number,
      default: null,
    },
    // Store generic marks as an object/Map; accept JSON string and parse it automatically
    qbs_generic_marks: {
      type: Schema.Types.Mixed,
      set(value) {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            // If parsing fails, store raw string
            return value;
          }
        }
        return value;
      },
    },
  },
  {
    _id: false, // disable child-doc _id if you don't need it
    versionKey: false,
  },
);

const blueprintSchema = new Schema(
  {
    qbs_blp_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      primaryKey: true,
    },
    qbs_blp_name: {
      type: String,
      required: true,
      trim: true,
    },
    qbs_blp_added_by: {
      type: Number,
      required: true,
    },
    qbs_blp_dept_id: {
      type: Number,
      required: true,
    },
    qbs_sub_id: {
      type: Number,
      required: true,
    },
    qbs_creative: {
      type: Number,
      default: 0,
    },
    qbs_blp_added_at:{
      type: Date,
      default: Date.now,
    },
    blueprint_marks: {
      type: [BlueprintMarkSchema],
      default: [],
    },
  },
  {
    timestamps: false, // adds createdAt and updatedAt
    versionKey: false, // disable __v
    collection: 'blueprints',
  },
);

// Ensure model registration is idempotent (works with hot-reload)
const Blueprint = mongoose.models.Blueprint || mongoose.model('Blueprint', blueprintSchema);

export default Blueprint;