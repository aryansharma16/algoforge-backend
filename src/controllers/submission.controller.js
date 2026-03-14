const submissionService = require("../services/submission.service");
const { asyncHandler } = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const rows = await submissionService.listSubmissions(
    req.userId,
    req.params.journeyId,
    req.params.itemId
  );
  res.json(rows);
});

const get = asyncHandler(async (req, res) => {
  const row = await submissionService.getSubmission(
    req.userId,
    req.params.journeyId,
    req.params.itemId,
    req.params.submissionId
  );
  res.json(row);
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.solvingMethod || !req.body.language) {
    return res.status(400).json({
      message: "solvingMethod and language are required",
    });
  }
  const row = await submissionService.createSubmission(
    req.userId,
    req.params.journeyId,
    req.params.itemId,
    req.body
  );
  res.status(201).json(row);
});

const update = asyncHandler(async (req, res) => {
  const row = await submissionService.updateSubmission(
    req.userId,
    req.params.journeyId,
    req.params.itemId,
    req.params.submissionId,
    req.body
  );
  res.json(row);
});

const remove = asyncHandler(async (req, res) => {
  const result = await submissionService.deleteSubmission(
    req.userId,
    req.params.journeyId,
    req.params.itemId,
    req.params.submissionId
  );
  res.json(result);
});

module.exports = { list, get, create, update, remove };
