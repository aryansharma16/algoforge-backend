const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const { authRequired } = require("./middleware/auth");
const authController = require("./controllers/auth.controller");
const journeyRoutes = require("./routes/journey.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const dashboardController = require("./controllers/dashboard.controller");

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/*
 * Auth: define every path on `app` — do NOT use app.use("/api/auth", router).
 * A mounted router at "/api/auth" runs first for all /api/auth/* URLs; if anything
 * is wrong inside that router, you get 404 and authRequired never runs.
 */
app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);
app.get("/api/auth/me", authRequired, authController.getUserDetails);
app.patch("/api/auth/me", authRequired, authController.patchMe);
app.get("/api/auth/user-details", authRequired, authController.getUserDetails);
app.get("/api/auth/dashboard", authRequired, dashboardController.getDashboard);

app.use("/api/journeys", journeyRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

module.exports = app;
