const app = require("../src/app");
const { connectToDatabase } = require("../src/config/db");

// Track database connection per serverless instance
let isDbConnected = false;

// Middleware to ensure DB connection is ready before handling requests
app.use(async (req, res, next) => {
  if (!isDbConnected) {
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch (err) {
      console.error("[api] Database connection failed in serverless handler:", err);
      return res.status(500).json({ error: "Internal Server Error - Database connection failed" });
    }
  }
  next();
});

// Vercel handles the listening, so we just export the Express app
module.exports = app;
