const mongoose = require("mongoose");

const SOLVING_METHODS = [
  "self",
  "hint",
  "partial_help",
  "full_solution",
  "failed",
];

const SUBMISSION_RESULTS = [
  "unspecified",
  "accepted",
  "wrong_answer",
  "time_limit",
  "runtime_error",
  "partial",
];

/** UI flag color kind (maps to badge/flag styling on the client) */
const SUBMISSION_FLAG_COLORS = [
  "none",
  "gray",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
];

const submissionSchema = new mongoose.Schema(
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
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningItem",
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    solvingMethod: {
      type: String,
      required: true,
      enum: SOLVING_METHODS,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    languageVersion: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
    code: {
      type: String,
      default: "",
      maxlength: 500_000,
    },
    timeComplexity: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    spaceComplexity: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    tags: {
      type: [String],
      default: [],
    },
    resultStatus: {
      type: String,
      enum: SUBMISSION_RESULTS,
      default: "unspecified",
      index: true,
    },
    /** Which flag color to show for this submission (success, warning, etc.) */
    flagColor: {
      type: String,
      enum: SUBMISSION_FLAG_COLORS,
      default: "none",
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    runtimeMs: {
      type: Number,
      min: 0,
    },
    memoryKb: {
      type: Number,
      min: 0,
    },
    testCasesPassed: {
      type: Number,
      min: 0,
      default: 0,
    },
    testCasesTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    externalUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    reviewerNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },
    reviewedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    versionKey: false,
  }
);

submissionSchema.index({ itemId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, journeyId: 1, itemId: 1 });
submissionSchema.index({ userId: 1, isStarred: 1 });
/** Dashboard counts, recent activity, time-range queries */
submissionSchema.index({ userId: 1, createdAt: -1 });
/** Next attemptNumber lookup */
submissionSchema.index({ userId: 1, itemId: 1, attemptNumber: -1 });

const Submission = mongoose.model("Submission", submissionSchema);
module.exports = Submission;
module.exports.SOLVING_METHODS = SOLVING_METHODS;
module.exports.SUBMISSION_RESULTS = SUBMISSION_RESULTS;
module.exports.SUBMISSION_FLAG_COLORS = SUBMISSION_FLAG_COLORS;
