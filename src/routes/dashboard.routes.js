const express = require("express");
const { authRequired } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authRequired);
router.get("/", dashboardController.getDashboard);

module.exports = router;
