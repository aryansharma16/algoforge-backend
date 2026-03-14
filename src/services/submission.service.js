const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const LearningItem = require("../models/LearningItem");
const learningItemService = require("./learningItem.service");
const journeyService = require("./journey.service");

function notFound(message = "Not found") {
  const err = new Error(message);
  err.statusCode = 404;
  throw err;
}

async function syncItemSubmissionStats(itemId) {
  const count = await Submission.countDocuments({ itemId });
  const last = await Submission.findOne({ itemId })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();
  await LearningItem.updateOne(
    { _id: itemId },
    {
      $set: {
        submissionCount: count,
        ...(last ? { lastSubmissionAt: last.createdAt } : { lastSubmissionAt: null }),
      },
    }
  );
}

async function listSubmissions(userId, journeyId, itemId) {
  await learningItemService.getItem(userId, journeyId, itemId);
  return Submission.find({ itemId, userId, journeyId })
    .sort({ createdAt: -1 })
    .lean();
}

async function getSubmission(userId, journeyId, itemId, submissionId) {
  const s = await Submission.findOne({
    _id: submissionId,
    itemId,
    journeyId,
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();
  if (!s) notFound("Submission not found");
  return s;
}

async function createSubmission(userId, journeyId, itemId, body) {
  await learningItemService.getItem(userId, journeyId, itemId);

  let attemptNumber = body.attemptNumber;
  if (attemptNumber == null) {
    const last = await Submission.findOne({ itemId, userId })
      .sort({ attemptNumber: -1 })
      .select("attemptNumber")
      .lean();
    attemptNumber = last ? last.attemptNumber + 1 : 1;
  }

  const doc = await Submission.create({
    userId,
    journeyId,
    itemId,
    attemptNumber,
    solvingMethod: body.solvingMethod,
    language: body.language,
    languageVersion: body.languageVersion ?? "",
    code: body.code ?? "",
    timeComplexity: body.timeComplexity ?? "",
    spaceComplexity: body.spaceComplexity ?? "",
    notes: body.notes ?? "",
    title: body.title ?? "",
    tags: body.tags ?? [],
    resultStatus: body.resultStatus,
    score: body.score,
    durationSeconds: body.durationSeconds,
    runtimeMs: body.runtimeMs,
    memoryKb: body.memoryKb,
    testCasesPassed: body.testCasesPassed ?? 0,
    testCasesTotal: body.testCasesTotal ?? 0,
    isStarred: body.isStarred ?? false,
    externalUrl: body.externalUrl ?? "",
    reviewerNotes: body.reviewerNotes ?? "",
    reviewedAt: body.reviewedAt,
    metadata: body.metadata ?? {},
  });

  await LearningItem.updateOne(
    { _id: itemId },
    {
      $inc: { submissionCount: 1 },
      $set: { lastSubmissionAt: doc.createdAt },
    }
  );
  await journeyService.touchJourneyActivity(journeyId);

  return doc.toObject();
}

const UPDATE_SUBMISSION_FIELDS = [
  "attemptNumber",
  "solvingMethod",
  "language",
  "languageVersion",
  "code",
  "timeComplexity",
  "spaceComplexity",
  "notes",
  "title",
  "tags",
  "resultStatus",
  "score",
  "durationSeconds",
  "runtimeMs",
  "memoryKb",
  "testCasesPassed",
  "testCasesTotal",
  "isStarred",
  "externalUrl",
  "reviewerNotes",
  "reviewedAt",
  "metadata",
];

async function updateSubmission(userId, journeyId, itemId, submissionId, body) {
  await getSubmission(userId, journeyId, itemId, submissionId);
  const $set = {};
  for (const k of UPDATE_SUBMISSION_FIELDS) {
    if (body[k] !== undefined) $set[k] = body[k];
  }
  const s = await Submission.findOneAndUpdate(
    { _id: submissionId, itemId, journeyId, userId },
    { $set },
    { new: true, runValidators: true }
  ).lean();
  if (!s) notFound("Submission not found");
  await journeyService.touchJourneyActivity(journeyId);
  return s;
}

async function deleteSubmission(userId, journeyId, itemId, submissionId) {
  const r = await Submission.deleteOne({
    _id: submissionId,
    itemId,
    journeyId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (r.deletedCount === 0) notFound("Submission not found");
  await syncItemSubmissionStats(itemId);
  await journeyService.touchJourneyActivity(journeyId);
  return { deleted: true };
}

module.exports = {
  listSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
};
