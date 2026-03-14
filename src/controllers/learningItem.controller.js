const learningItemService = require("../services/learningItem.service");
const { asyncHandler } = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const rows = await learningItemService.listItems(
    req.userId,
    req.params.journeyId
  );
  res.json(rows);
});

const get = asyncHandler(async (req, res) => {
  const row = await learningItemService.getItem(
    req.userId,
    req.params.journeyId,
    req.params.itemId
  );
  res.json(row);
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: "title is required" });
  }
  const row = await learningItemService.createItem(
    req.userId,
    req.params.journeyId,
    req.body
  );
  res.status(201).json(row);
});

const update = asyncHandler(async (req, res) => {
  const row = await learningItemService.updateItem(
    req.userId,
    req.params.journeyId,
    req.params.itemId,
    req.body
  );
  res.json(row);
});

const remove = asyncHandler(async (req, res) => {
  const result = await learningItemService.deleteItem(
    req.userId,
    req.params.journeyId,
    req.params.itemId
  );
  res.json(result);
});

module.exports = { list, get, create, update, remove };
