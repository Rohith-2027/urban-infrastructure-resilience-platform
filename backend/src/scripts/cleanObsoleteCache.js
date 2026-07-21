import "dotenv/config";
import mongoose from "mongoose";
import config from "../config/env.js";
import { cleanObsoleteCache } from "../services/cache.service.js";

const run = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("[CleanCache] Connected to MongoDB");
    const count = await cleanObsoleteCache();
    console.log(`[CleanCache] Removed ${count} obsolete cache entries`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("[CleanCache] Failed:", error.message);
    process.exit(1);
  }
};

run();
