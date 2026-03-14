const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, default: "", trim: true },
    degree: { type: String, default: "", trim: true },
    field: { type: String, default: "", trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const workExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

/**
 * Social / coding profiles: type + url (e.g. linkedin, github, leetcode, gfg).
 * type: short id for UI icons; url: full profile link.
 */
const socialProfileSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 32,
      /** Common: linkedin | github | leetcode | gfg | codeforces | website | other */
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 64,
    },
    /** Public-facing name (can differ from username). */
    displayName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    photo: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    organisation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    number: {
      type: String,
      default: "",
      trim: true,
      maxlength: 32,
    },
    resume: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    city: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    workExperience: {
      type: [workExperienceSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    currentCompany: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    socialProfiles: {
      type: [socialProfileSchema],
      default: [],
      validate: [
        (arr) => arr.length <= 20,
        "At most 20 social profile entries",
      ],
    },
  },
  {
    versionKey: false,
  }
);

userSchema.index({ username: 1 });

module.exports = mongoose.model("User", userSchema);
