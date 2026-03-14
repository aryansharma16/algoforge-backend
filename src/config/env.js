require("dotenv").config();

function required(name) {
  const v = process.env[name];
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

const mongodbUri =
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
if (!mongodbUri || String(mongodbUri).trim() === "") {
  throw new Error("Missing required env: MONGODB_URI (or MONGO_URI)");
}

module.exports = {
  port: parseInt(process.env.PORT || "3000", 10),
  mongodbUri,
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
};
