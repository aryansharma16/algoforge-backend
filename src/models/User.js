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

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 64,
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
  },
  {
    versionKey: false,
  }
);

userSchema.index({ username: 1 });

module.exports = mongoose.model("User", userSchema);
