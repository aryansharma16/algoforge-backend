const express = require("express");
const { authRequired } = require("../middleware/auth");
const journeyController = require("../controllers/journey.controller");
const learningItemRoutes = require("./learningItem.routes");

const router = express.Router();

router.use(authRequired);

router.get("/", journeyController.list);
router.post("/", journeyController.create);

router.use("/:journeyId/items", learningItemRoutes);

router.get("/:journeyId", journeyController.get);
router.patch("/:journeyId", journeyController.update);
router.delete("/:journeyId", journeyController.remove);

module.exports = router;
