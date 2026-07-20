import { buildQuery, requestOverpass } from "./overpass.service.js";
import { getCache, saveCache } from "./cache.service.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const SUPPORTED_LAYERS = [
  "roads",
  "hospitals",
  "fireStations",
  "policeStations",
  "emergencyServices",
];

const STUDY_AREA_NAMES = ["default"];

const polygonToName = new Map();

const resolveStudyAreaName = (polygon) => {
  if (polygonToName.size === 0) {
    for (const name of STUDY_AREA_NAMES) {
      const area = getStudyArea(name);
      if (area) {
        polygonToName.set(toOverpassPolygon(area), name);
      }
    }
  }

  return polygonToName.get(polygon) || polygon;
};

/** Check whether a layer name is supported. */
export const isValidLayer = (layer) => SUPPORTED_LAYERS.includes(layer);

/** Fetch infrastructure data for a validated layer and study area polygon. */
export const fetchInfrastructureData = async (layer, polygon, signal) => {
  if (!isValidLayer(layer)) {
    throw Object.assign(new Error(`Invalid layer: ${layer}`), { statusCode: 400 });
  }

  const studyAreaName = resolveStudyAreaName(polygon);

  try {
    const cached = await getCache(layer, studyAreaName);

    if (cached) {
      return cached;
    }
  } catch {
    // Cache read failures must not crash the application.
  }

  console.log(`[Overpass] Fetch ${layer}/${studyAreaName}`);
  const query = buildQuery(layer, polygon);
  const data = await requestOverpass(query, signal);
  console.log(`[Overpass] Success`);

  try {
    await saveCache(layer, studyAreaName, data);
  } catch {
    // Cache write failures must not crash the application.
  }

  return data;
};
