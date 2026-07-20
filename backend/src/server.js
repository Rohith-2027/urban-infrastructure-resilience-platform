import "dotenv/config";
import config, { validateEnv } from "./config/env.js";
import app from "./app.js";
import connectMongo from "./config/mongo.js";
import { CACHE_TTL_HOURS } from "./constants/cache.constants.js";

const start = async () => {
  validateEnv();

  await connectMongo();

  app.listen(config.port, () => {
    console.log("\n" + "=".repeat(42));
    console.log("Urban Infrastructure Backend");
    console.log("=".repeat(42) + "\n");
    console.log(`  ✓ Environment : ${config.nodeEnv}`);
    console.log(`  ✓ MongoDB     : Connected`);
    console.log(`  ✓ Cache TTL   : ${CACHE_TTL_HOURS} hours`);
    console.log(`  ✓ Port        : ${config.port}\n`);
    console.log("  ✓ Ready\n");
    console.log("=".repeat(42));
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
