const express = require("express");
const { authRequired } = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

/** Current user profile (UI). Alias: getUserDetails */
router.get("/me", authRequired, authController.getUserDetails);
router.get("/user-details", authRequired, authController.getUserDetails);

module.exports = router;
