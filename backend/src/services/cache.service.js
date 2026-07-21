import InfrastructureCache from "../models/InfrastructureCache.js";
import { CACHE_TTL_MS } from "../constants/cache.constants.js";

export const getCache = async (layer, studyArea) => {
  try {
    const entry = await InfrastructureCache.findOne({ layer, studyArea });

    if (!entry) {
      console.log(`[Cache] MISS ${layer}/${studyArea}`);
      return null;
    }

    if (Date.now() - entry.lastFetched.getTime() >= CACHE_TTL_MS) {
      console.log(`[Cache] MISS ${layer}/${studyArea}`);
      return null;
    }

    console.log(`[Cache] HIT ${layer}/${studyArea}`);
    return entry.data;
  } catch {
    return null;
  }
};

export const saveCache = async (layer, studyArea, data) => {
  try {
    await InfrastructureCache.findOneAndUpdate(
      { layer, studyArea },
      { data, lastFetched: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[Cache] SAVED ${layer}/${studyArea}`);
  } catch {
    // Cache write failures must not crash the application.
  }
};

export const invalidateCache = async (layer, studyArea) => {
  try {
    await InfrastructureCache.deleteOne({ layer, studyArea });
  } catch {
    // Cache delete failures must not crash the application.
  }
};

const OBSOLETE_LAYER_NAMES = [
  "powerPole",
  "powerTower",
  "powerMinorLine",
  "powerTransformer",
  "powerLine",
  "power-substations",
  "powerSubstationsCombined",
  "fire-stations",
  "police-stations",
  "water-infrastructure",
  "emergency-services",
  "emergencyServices",
];

export const cleanObsoleteCache = async () => {
  try {
    const result = await InfrastructureCache.deleteMany({ layer: { $in: OBSOLETE_LAYER_NAMES } });
    console.log(`[Cache] Cleaned ${result.deletedCount} obsolete cache entr${result.deletedCount === 1 ? "y" : "ies"}`);
    return result.deletedCount;
  } catch (error) {
    console.error(`[Cache] Clean failed: ${error.message}`);
    return 0;
  }
};
