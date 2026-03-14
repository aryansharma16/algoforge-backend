const mongoose = require("mongoose");

/**
 * Central error handler. Maps known errors to HTTP status + JSON.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isDev = process.env.NODE_ENV !== "production";

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: "Validation failed",
      errors: messages.length ? messages : [err.message],
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      message: "Duplicate value",
      field,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid id format" });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message || "Error",
      ...(isDev && err.details ? { details: err.details } : {}),
    });
  }

  console.error(err);
  return res.status(500).json({
    message: isDev ? err.message : "Internal server error",
  });
}

module.exports = { errorHandler };
