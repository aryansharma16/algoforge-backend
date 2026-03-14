const dashboardService = require("../services/dashboard.service");
const { asyncHandler } = require("../utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const payload = await dashboardService.getDashboard(req.userId);
  res.json(payload);
});

module.exports = { getDashboard };
