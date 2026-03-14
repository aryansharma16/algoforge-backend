const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const LearningItem = require("../models/LearningItem");
const Submission = require("../models/Submission");

const SOLVING_METHOD_BUCKETS = [
  "self",
  "hint",
  "partial_help",
  "full_solution",
  "failed",
];

function solvingMethodCountsFromAggregation(rows) {
  const map = Object.fromEntries(SOLVING_METHOD_BUCKETS.map((k) => [k, 0]));
  for (const r of rows || []) {
    const key = r._id;
    if (key != null && map[key] !== undefined) {
      map[key] = r.count;
    }
  }
  return map;
}

function toObjectId(userId) {
  return new mongoose.Types.ObjectId(userId);
}

/** YYYY-MM-DD in UTC */
function dateKeyUTC(d) {
  return d.toISOString().slice(0, 10);
}

/** Parse YYYY-MM-DD as UTC midnight */
function parseDateKeyUTC(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Add days to a date key string */
function addDaysKey(key, delta) {
  const dt = parseDateKeyUTC(key);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dateKeyUTC(dt);
}

function daysBetweenKeys(earlierKey, laterKey) {
  const a = parseDateKeyUTC(earlierKey).getTime();
  const b = parseDateKeyUTC(laterKey).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Distinct UTC calendar days that have at least one submission.
 * Single aggregation: match user → group by date string → sort desc.
 * Returns { desc: newest first (for lastSolvedDate), asc: oldest first (for longest streak) }.
 */
async function fetchSubmissionDateKeys(userId) {
  const uid = toObjectId(userId);
  const rows = await Submission.aggregate([
    { $match: { userId: uid } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const asc = rows.map((r) => r._id);
  const desc = [...asc].reverse();
  return { asc, desc };
}

/**
 * Longest run of consecutive calendar days with at least one submission each day.
 */
function computeLongestStreak(sortedAscKeys) {
  if (!sortedAscKeys.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedAscKeys.length; i++) {
    if (daysBetweenKeys(sortedAscKeys[i - 1], sortedAscKeys[i]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Current streak: consecutive days with submissions, must include today (UTC).
 * If no submission today → 0.
 */
function computeCurrentStreakEndingToday(daySet, todayKey) {
  if (!daySet.has(todayKey)) return 0;
  let streak = 0;
  let k = todayKey;
  while (daySet.has(k)) {
    streak += 1;
    k = addDaysKey(k, -1);
  }
  return streak;
}

/**
 * Streak broken = no submission today. Then: calendar days from lastSolvedDate to today.
 * If submitted today → 0. No submissions ever → 0.
 */
function computeMissedDaysWhenBroken(daySet, todayKey, lastSolvedDateKey) {
  if (!lastSolvedDateKey) return 0;
  if (daySet.has(todayKey)) return 0;
  return daysBetweenKeys(lastSolvedDateKey, todayKey);
}

async function resolveActiveJourney(userId) {
  const uid = toObjectId(userId);
  const sort = {
    lastActivityAt: -1,
    updatedAt: -1,
    createdAt: -1,
  };
  let j = await Journey.findOne({ userId: uid, status: "active" }).sort(sort).lean();
  if (!j) {
    j = await Journey.findOne({ userId: uid, status: "planned" }).sort(sort).lean();
  }
  return j;
}

function activeJourneySummary(j) {
  if (!j) return null;
  return {
    _id: j._id,
    title: j.title,
    status: j.status,
    targetItems: j.targetItems ?? 0,
    endDate: j.endDate ?? null,
  };
}

/**
 * Calendar days from today (UTC start) to endDate (UTC start).
 * remainingDays ≈ endDate - currentDate. Null if no endDate. Can be negative if endDate passed.
 */
function remainingJourneyDays(endDate) {
  if (!endDate) return null;
  const endDay = new Date(endDate);
  endDay.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const ms = endDay.getTime() - today.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

async function getDashboard(userId) {
  const uid = toObjectId(userId);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayKey = dateKeyUTC(todayStart);

  const [
    activeJourneyDoc,
    totalItems,
    totalSubmissions,
    submissionDateKeys,
    todaySubmissions,
    weeklySubmissions,
    recentActivityRaw,
    difficultyRows,
    tagFacet,
    solvingRows,
  ] = await Promise.all([
    resolveActiveJourney(userId),
    LearningItem.countDocuments({ userId: uid }),
    Submission.countDocuments({ userId: uid }),
    fetchSubmissionDateKeys(userId),
    Submission.countDocuments({
      userId: uid,
      createdAt: { $gte: todayStart, $lt: tomorrowStart },
    }),
    Submission.countDocuments({ userId: uid, createdAt: { $gte: weekAgo } }),
    Submission.aggregate([
      { $match: { userId: uid } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "learningitems",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      {
        $lookup: {
          from: "journeys",
          localField: "journeyId",
          foreignField: "_id",
          as: "journey",
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          solvingMethod: 1,
          itemTitle: { $arrayElemAt: ["$item.title", 0] },
          journeyTitle: { $arrayElemAt: ["$journey.title", 0] },
        },
      },
    ]),
    LearningItem.aggregate([
      { $match: { userId: uid } },
      {
        $project: {
          diff: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ["$personalDifficulty", ""] } }, 0] },
              "$personalDifficulty",
              {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: ["$platformDifficulty", ""] } }, 0] },
                  "$platformDifficulty",
                  "unspecified",
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: "$diff", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]),
    LearningItem.aggregate([
      { $match: { userId: uid } },
      {
        $facet: {
          topTags: [
            { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          tagDistribution: [
            { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
          ],
        },
      },
    ]).then((rows) => rows[0] || { topTags: [], tagDistribution: [] }),
    Submission.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: "$solvingMethod", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const { asc: datesAsc, desc: datesDesc } = submissionDateKeys;
  const daySet = new Set(datesAsc);
  const lastSolvedDate = datesDesc.length ? datesDesc[0] : null;
  const longestStreak = computeLongestStreak(datesAsc);
  const currentStreak = computeCurrentStreakEndingToday(daySet, todayKey);
  const missedDays = computeMissedDaysWhenBroken(
    daySet,
    todayKey,
    lastSolvedDate
  );

  let targetItems = 0;
  let completedItems = 0;
  let remainingItems = 0;
  let remainingJourneyDaysVal = null;
  const activeJourney = activeJourneySummary(activeJourneyDoc);

  if (activeJourneyDoc) {
    targetItems = activeJourneyDoc.targetItems ?? 0;
    completedItems = await LearningItem.countDocuments({
      userId: uid,
      journeyId: activeJourneyDoc._id,
      status: "completed",
    });
    remainingItems =
      targetItems > 0
        ? Math.max(0, targetItems - completedItems)
        : await LearningItem.countDocuments({
            userId: uid,
            journeyId: activeJourneyDoc._id,
            status: { $ne: "completed" },
          });
    remainingJourneyDaysVal = remainingJourneyDays(activeJourneyDoc.endDate);
  }

  const recentActivity = recentActivityRaw.map((r) => ({
    itemTitle: r.itemTitle || null,
    journeyTitle: r.journeyTitle || null,
    solvingMethod: r.solvingMethod,
    createdAt: r.createdAt,
    _id: r._id,
  }));

  return {
    core: {
      totalItems,
      totalSubmissions,
    },
    journey: {
      activeJourney,
      targetItems,
      completedItems,
      remainingItems,
      remainingJourneyDays: remainingJourneyDaysVal,
    },
    streak: {
      currentStreak,
      longestStreak,
      lastSolvedDate,
      missedDays,
    },
    activity: {
      todaySubmissions,
      weeklySubmissions,
      recentActivity,
    },
    tagAnalytics: {
      topTags: (tagFacet.topTags || []).map((r) => ({
        tag: r._id,
        count: r.count,
      })),
    },
    distribution: {
      difficultyDistribution: difficultyRows.map((r) => ({
        label: r._id || "unspecified",
        count: r.count,
      })),
      tagDistribution: (tagFacet.tagDistribution || []).map((r) => ({
        label: r._id,
        count: r.count,
      })),
      /** Grouped by solvingMethod; always includes self, hint, partial_help, full_solution, failed */
      solvingMethodDistribution: solvingMethodCountsFromAggregation(solvingRows),
    },
  };
}

module.exports = { getDashboard };
