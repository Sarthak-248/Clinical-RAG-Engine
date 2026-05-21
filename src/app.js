const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes/qa.routes");
const { errorHandler } = require("./middleware/error-handler");
const env = require("./config/env");

const app = express();

const defaultDevOrigins = new Set(["http://localhost:5173", "http://localhost:5174"]);
const configuredOrigins = new Set(env.clientOrigins || []);

if (env.nodeEnv !== "production") {
  for (const origin of defaultDevOrigins) {
    configuredOrigins.add(origin);
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (configuredOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api", routes);

app.use(errorHandler);

module.exports = app;
