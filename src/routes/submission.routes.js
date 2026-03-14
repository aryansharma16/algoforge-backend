const express = require("express");
const submissionController = require("../controllers/submission.controller");

const router = express.Router({ mergeParams: true });

router.get("/", submissionController.list);
router.post("/", submissionController.create);
router.get("/:submissionId", submissionController.get);
router.patch("/:submissionId", submissionController.update);
router.delete("/:submissionId", submissionController.remove);

module.exports = router;
