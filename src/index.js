const app = require("./app");
const env = require("./config/env");
const { connectToDatabase } = require("./config/db");

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.info(`[api] Medical QA API running on port ${env.port}`);
  });
}

startServer();
