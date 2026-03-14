require("dotenv").config();
const mongoose = require("mongoose");
const env = require("./config/env");
const app = require("./app");

async function main() {
  await mongoose.connect(env.mongodbUri);
  app.listen(env.port, () => {
    console.log(`AlgoForge API listening on port ...${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
