const mongoose = require("mongoose");

const LEARNING_ITEM_TYPES = [
  "problem",
  "topic",
  "reading",
  "video",
  "task",
  "other",
];

const ITEM_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    type: { type: String, default: "" },
  },
  { _id: false }
);

const learningItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },
    type: {
      type: String,
      enum: LEARNING_ITEM_TYPES,
      default: "problem",
      index: true,
    },
    status: {
      type: String,
      enum: ITEM_STATUSES,
      default: "pending",
      index: true,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    platform: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    platformId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    platformUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    platformDifficulty: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
    personalDifficulty: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20000,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    flags: {
      type: [String],
      default: [],
    },
    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSubmissionAt: {
      type: Date,
    },
    revisionRequired: {
      type: Boolean,
      default: false,
    },
    revisionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

learningItemSchema.index({ journeyId: 1, createdAt: -1 });
learningItemSchema.index({ journeyId: 1, orderIndex: 1 });
learningItemSchema.index({ userId: 1, journeyId: 1 });
learningItemSchema.index({ userId: 1, tags: 1 });
/** Dashboard completed count per journey */
learningItemSchema.index({ userId: 1, journeyId: 1, status: 1 });

const LearningItem = mongoose.model("LearningItem", learningItemSchema);
module.exports = LearningItem;
module.exports.LEARNING_ITEM_TYPES = LEARNING_ITEM_TYPES;
module.exports.ITEM_STATUSES = ITEM_STATUSES;
