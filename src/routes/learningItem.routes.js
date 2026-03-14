const express = require("express");
const learningItemController = require("../controllers/learningItem.controller");
const submissionRoutes = require("./submission.routes");

const router = express.Router({ mergeParams: true });

router.use("/:itemId/submissions", submissionRoutes);

router.get("/", learningItemController.list);
router.post("/", learningItemController.create);
router.get("/:itemId", learningItemController.get);
router.patch("/:itemId", learningItemController.update);
router.delete("/:itemId", learningItemController.remove);

module.exports = router;
