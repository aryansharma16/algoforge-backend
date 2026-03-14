const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

function userPublic(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    createdAt: doc.createdAt,
  };
}

/** Full profile for UI (never includes passwordHash). */
function toUserDetails(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.passwordHash;
  return {
    id: o._id.toString(),
    username: o.username,
    email: o.email,
    createdAt: o.createdAt,
    photo: o.photo ?? "",
    organisation: o.organisation ?? "",
    number: o.number ?? "",
    resume: o.resume ?? "",
    address: o.address ?? "",
    city: o.city ?? "",
    state: o.state ?? "",
    country: o.country ?? "",
    education: o.education ?? [],
    workExperience: o.workExperience ?? [],
    skills: o.skills ?? [],
    currentCompany: o.currentCompany ?? "",
  };
}

async function getUserDetails(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return toUserDetails(user);
}

async function register({ username, email, password }) {
  if (!username || !email || !password) {
    const err = new Error("username, email, and password are required");
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 8) {
    const err = new Error("password must be at least 8 characters");
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ username, email, passwordHash });
  const token = signToken(user._id.toString());
  return { token, user: userPublic(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.statusCode = 400;
    throw err;
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash"
  );
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  const token = signToken(user._id.toString());
  return { token, user: userPublic(user) };
}

module.exports = { register, login, userPublic, getUserDetails, toUserDetails };
