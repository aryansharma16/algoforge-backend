const mongoose = require("mongoose");
const LearningItem = require("../models/LearningItem");
const Submission = require("../models/Submission");
const journeyService = require("./journey.service");

function notFound(message = "Not found") {
  const err = new Error(message);
  err.statusCode = 404;
  throw err;
}

async function listItems(userId, journeyId) {
  await journeyService.assertJourney(userId, journeyId);
  return LearningItem.find({ journeyId, userId })
    .sort({ orderIndex: 1, createdAt: -1 })
    .lean();
}

async function getItem(userId, journeyId, itemId) {
  const item = await LearningItem.findOne({
    _id: itemId,
    journeyId,
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();
  if (!item) notFound("Learning item not found");
  return item;
}

async function createItem(userId, journeyId, body) {
  await journeyService.assertJourney(userId, journeyId);
  const doc = await LearningItem.create({
    userId,
    journeyId,
    title: body.title,
    description: body.description ?? "",
    type: body.type,
    status: body.status,
    orderIndex: body.orderIndex ?? 0,
    platform: body.platform ?? "",
    platformId: body.platformId ?? "",
    platformUrl: body.platformUrl ?? "",
    platformDifficulty: body.platformDifficulty ?? "",
    personalDifficulty: body.personalDifficulty ?? "",
    tags: body.tags ?? [],
    notes: body.notes ?? "",
    resources: body.resources ?? [],
    flags: body.flags ?? [],
    revisionRequired: body.revisionRequired ?? false,
    revisionCount: body.revisionCount ?? 0,
    lastReviewedAt: body.lastReviewedAt,
  });
  await journeyService.touchJourneyActivity(journeyId);
  return doc.toObject();
}

async function updateItem(userId, journeyId, itemId, body) {
  const allowed = [
    "title",
    "description",
    "type",
    "status",
    "orderIndex",
    "platform",
    "platformId",
    "platformUrl",
    "platformDifficulty",
    "personalDifficulty",
    "tags",
    "notes",
    "resources",
    "flags",
    "revisionRequired",
    "revisionCount",
    "lastReviewedAt",
    "submissionCount",
    "lastSubmissionAt",
  ];
  const $set = {};
  for (const k of allowed) {
    if (body[k] !== undefined) $set[k] = body[k];
  }
  const item = await LearningItem.findOneAndUpdate(
    { _id: itemId, journeyId, userId },
    { $set },
    { new: true, runValidators: true }
  ).lean();
  if (!item) notFound("Learning item not found");
  await journeyService.touchJourneyActivity(journeyId);
  return item;
}

/**
 * Cascade: delete all submissions for this item, then the item.
 */
async function deleteItem(userId, journeyId, itemId) {
  const item = await LearningItem.findOne({
    _id: itemId,
    journeyId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!item) notFound("Learning item not found");

  await Submission.deleteMany({ itemId });
  await LearningItem.deleteOne({ _id: itemId, userId });
  await journeyService.touchJourneyActivity(journeyId);
  return { deleted: true };
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};
