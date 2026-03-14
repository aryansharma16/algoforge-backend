const authService = require("../services/auth.service");
const { asyncHandler } = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

/** GET current user profile for UI (JWT). */
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await authService.getUserDetails(req.userId);
  res.json(user);
});

module.exports = { register, login, getUserDetails };
