const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

function userPublic(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    displayName: doc.displayName ?? "",
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
    displayName: o.displayName ?? "",
    bio: o.bio ?? "",
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
    socialProfiles: Array.isArray(o.socialProfiles) ? o.socialProfiles : [],
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

/** Fields the client may change via PATCH /api/auth/me (email is never applied). */
const PATCHABLE = new Set([
  "username",
  "displayName",
  "bio",
  "photo",
  "organisation",
  "number",
  "resume",
  "address",
  "city",
  "state",
  "country",
  "education",
  "workExperience",
  "skills",
  "currentCompany",
  "socialProfiles",
]);

function sanitizePatch(body) {
  if (!body || typeof body !== "object") return {};
  const out = {};
  for (const key of PATCHABLE) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const v = body[key];
    if (key === "username") {
      if (typeof v !== "string") continue;
      const s = v.trim();
      if (s.length >= 2 && s.length <= 64) out.username = s;
      continue;
    }
    if (key === "displayName" && typeof v === "string") {
      out.displayName = v.trim().slice(0, 120);
      continue;
    }
    if (key === "bio" && typeof v === "string") {
      out.bio = v.trim().slice(0, 2000);
      continue;
    }
    if (
      ["photo", "organisation", "number", "resume", "address"].includes(key) &&
      typeof v === "string"
    ) {
      const max =
        key === "photo" || key === "resume"
          ? 2000
          : key === "address"
            ? 500
            : key === "organisation"
              ? 200
              : 32;
      out[key] = v.trim().slice(0, max);
      continue;
    }
    if (["city", "state", "country", "currentCompany"].includes(key) && typeof v === "string") {
      out[key] = v.trim().slice(0, 200);
      continue;
    }
    if (key === "skills" && Array.isArray(v)) {
      out.skills = v.filter((x) => typeof x === "string").map((x) => x.trim()).slice(0, 100);
      continue;
    }
    if (key === "education" && Array.isArray(v)) {
      out.education = v;
      continue;
    }
    if (key === "workExperience" && Array.isArray(v)) {
      out.workExperience = v;
      continue;
    }
    if (key === "socialProfiles" && Array.isArray(v)) {
      out.socialProfiles = v
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const type =
            typeof item.type === "string" ? item.type.trim().toLowerCase().slice(0, 32) : "";
          const url = typeof item.url === "string" ? item.url.trim().slice(0, 2000) : "";
          const label =
            typeof item.label === "string" ? item.label.trim().slice(0, 80) : "";
          if (!type || !url) return null;
          return { type, url, label };
        })
        .filter(Boolean)
        .slice(0, 20);
      continue;
    }
  }
  return out;
}

/**
 * Update profile. Email cannot be changed (ignored; if only email sent, still ok).
 * Rejects explicit attempt to set email with 400 so clients don’t think it worked.
 */
async function updateProfile(userId, body) {
  if (body && Object.prototype.hasOwnProperty.call(body, "email")) {
    const err = new Error("Email cannot be changed");
    err.statusCode = 400;
    throw err;
  }
  const updates = sanitizePatch(body);
  if (Object.keys(updates).length === 0) {
    const err = new Error("No valid fields to update");
    err.statusCode = 400;
    throw err;
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return toUserDetails(user);
}

async function register({ username, email, password, displayName, bio }) {
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
  const user = await User.create({
    username,
    email,
    passwordHash,
    displayName: typeof displayName === "string" ? displayName.trim().slice(0, 120) : "",
    bio: typeof bio === "string" ? bio.trim().slice(0, 2000) : "",
  });
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

module.exports = {
  register,
  login,
  userPublic,
  getUserDetails,
  toUserDetails,
  updateProfile,
};
