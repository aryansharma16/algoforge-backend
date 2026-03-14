const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const LearningItem = require("../models/LearningItem");
const Submission = require("../models/Submission");

function notFound(message = "Not found") {
  const err = new Error(message);
  err.statusCode = 404;
  throw err;
}

async function assertJourney(userId, journeyId) {
  const j = await Journey.findOne({
    _id: journeyId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!j) notFound("Journey not found");
  return j;
}

async function touchJourneyActivity(journeyId) {
  await Journey.updateOne(
    { _id: journeyId },
    { $set: { lastActivityAt: new Date() } }
  );
}

async function listJourneys(userId) {
  return Journey.find({ userId }).sort({ createdAt: -1 }).lean();
}

async function getJourney(userId, journeyId) {
  const j = await Journey.findOne({ _id: journeyId, userId }).lean();
  if (!j) notFound("Journey not found");
  return j;
}

async function createJourney(userId, body) {
  const now = new Date();
  const doc = await Journey.create({
    userId,
    title: body.title,
    description: body.description ?? "",
    category: body.category ?? "",
    journeyType: body.journeyType,
    targetItems: body.targetItems ?? 0,
    startDate: body.startDate,
    endDate: body.endDate,
    status: body.status,
    visibility: body.visibility,
    lastActivityAt: body.lastActivityAt ?? now,
    metadata: body.metadata ?? {},
    priority: body.priority ?? 0,
  });
  return doc.toObject();
}

async function updateJourney(userId, journeyId, body) {
  const j = await Journey.findOneAndUpdate(
    { _id: journeyId, userId },
    {
      $set: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.journeyType !== undefined && { journeyType: body.journeyType }),
        ...(body.targetItems !== undefined && { targetItems: body.targetItems }),
        ...(body.startDate !== undefined && { startDate: body.startDate }),
        ...(body.endDate !== undefined && { endDate: body.endDate }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.visibility !== undefined && { visibility: body.visibility }),
        ...(body.lastActivityAt !== undefined && {
          lastActivityAt: body.lastActivityAt,
        }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
        ...(body.priority !== undefined && { priority: body.priority }),
      },
    },
    { new: true, runValidators: true }
  ).lean();
  if (!j) notFound("Journey not found");
  return j;
}

/**
 * Cascade: delete all submissions for items in this journey, then items, then journey.
 */
async function deleteJourney(userId, journeyId) {
  const j = await Journey.findOne({ _id: journeyId, userId });
  if (!j) notFound("Journey not found");

  const items = await LearningItem.find({ journeyId }).select("_id").lean();
  const itemIds = items.map((i) => i._id);

  if (itemIds.length) {
    await Submission.deleteMany({ itemId: { $in: itemIds } });
    await LearningItem.deleteMany({ _id: { $in: itemIds } });
  }
  await Journey.deleteOne({ _id: journeyId, userId });
  return { deleted: true };
}

module.exports = {
  assertJourney,
  touchJourneyActivity,
  listJourneys,
  getJourney,
  createJourney,
  updateJourney,
  deleteJourney,
};
