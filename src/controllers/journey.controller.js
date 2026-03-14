const journeyService = require("../services/journey.service");
const { asyncHandler } = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const rows = await journeyService.listJourneys(req.userId);
  res.json(rows);
});

const get = asyncHandler(async (req, res) => {
  const row = await journeyService.getJourney(req.userId, req.params.journeyId);
  res.json(row);
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: "title is required" });
  }
  const row = await journeyService.createJourney(req.userId, req.body);
  res.status(201).json(row);
});

const update = asyncHandler(async (req, res) => {
  const row = await journeyService.updateJourney(
    req.userId,
    req.params.journeyId,
    req.body
  );
  res.json(row);
});

const remove = asyncHandler(async (req, res) => {
  const result = await journeyService.deleteJourney(
    req.userId,
    req.params.journeyId
  );
  res.json(result);
});

module.exports = { list, get, create, update, remove };
