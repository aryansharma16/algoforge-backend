const mongoose = require("mongoose");

const JOURNEY_STATUSES = [
  "planned",
  "active",
  "paused",
  "completed",
  "archived",
];

const JOURNEY_TYPES = [
  "DSA",
  "SYSTEM_DESIGN",
  "DBMS",
  "OS",
  "WEB_DEV",
  "CUSTOM",
];

const JOURNEY_VISIBILITY = ["private", "unlisted", "public"];

const journeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    journeyType: {
      type: String,
      enum: JOURNEY_TYPES,
      default: "CUSTOM",
      index: true,
    },
    targetItems: {
      type: Number,
      min: 0,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: JOURNEY_STATUSES,
      default: "planned",
      index: true,
    },
    visibility: {
      type: String,
      enum: JOURNEY_VISIBILITY,
      default: "private",
      index: true,
    },
    lastActivityAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

journeySchema.index({ userId: 1, createdAt: -1 });
journeySchema.index({ userId: 1, status: 1 });
/** Active-journey resolution (dashboard) */
journeySchema.index({ userId: 1, status: 1, lastActivityAt: -1 });

const Journey = mongoose.model("Journey", journeySchema);
module.exports = Journey;
module.exports.JOURNEY_STATUSES = JOURNEY_STATUSES;
module.exports.JOURNEY_TYPES = JOURNEY_TYPES;
module.exports.JOURNEY_VISIBILITY = JOURNEY_VISIBILITY;
