const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const journeyRoutes = require("./routes/journey.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/journeys", journeyRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

module.exports = app;
