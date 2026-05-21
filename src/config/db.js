const mongoose = require("mongoose");
const env = require("./env");

async function connectToDatabase() {
  if (!env.mongoUri) {
    console.warn("[db] MONGODB_URI not set. Running without persistence.");
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info("[db] Connected to MongoDB.");
  } catch (error) {
    console.error("[db] Failed to connect to MongoDB:", error.message);
  }
}

module.exports = { connectToDatabase };
