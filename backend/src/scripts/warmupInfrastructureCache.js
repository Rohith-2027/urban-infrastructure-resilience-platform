import "dotenv/config";
import mongoose from "mongoose";
import config from "../config/env.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";
import { getCache } from "../services/cache.service.js";
import { fetchInfrastructureData } from "../services/infrastructure.service.js";

const DISPLAY_NAMES = {
  roads: "Roads",
  hospitals: "Hospitals",
  fireStations: "Fire Stations",
  policeStations: "Police Stations",
  emergencyServices: "Emergency",
  "power-substations": "Power Substations",
  waterInfrastructure: "Water Infrastructure",
};

const LAYERS = Object.keys(DISPLAY_NAMES);
const STUDY_AREA = "default";

let isWarmingUp = false;

const run = async () => {
  try {
    await mongoose.connect(config.mongodbUri);

    const area = getStudyArea(STUDY_AREA);
    const polygon = toOverpassPolygon(area);

    for (const layer of LAYERS) {
      let cached = await getCache(layer, STUDY_AREA);

      if (!cached) {
        isWarmingUp = true;
        try {
          await fetchInfrastructureData(layer, polygon);
        } catch (error) {
          console.error(`\n[Warmup] ${DISPLAY_NAMES[layer]} failed: ${error.message}`);
        } finally {
          isWarmingUp = false;
        }
        cached = await getCache(layer, STUDY_AREA);
      }

      if (['policeStations', 'fireStations', 'emergencyServices'].includes(layer) && cached) {
        const manualCount = (cached.elements || []).filter((e) => e.tags && e.tags.source === 'manual').length;
        if (manualCount > 0) {
          console.log(`\n[Warmup] ${DISPLAY_NAMES[layer]} manual verification: ${manualCount} manual feature(s) added`);
        }
      }
    }

    await mongoose.disconnect();

    console.log("");
    for (const layer of LAYERS) {
      console.log(`${DISPLAY_NAMES[layer].padEnd(20)} Cached`);
    }
  } catch (error) {
    console.error("Warmup failed:", error.message);
    process.exit(1);
  }
};

run();
