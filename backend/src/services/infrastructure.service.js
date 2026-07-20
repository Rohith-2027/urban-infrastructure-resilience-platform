import { buildQuery, requestOverpass } from "./overpass.service.js";
import { getCache, saveCache } from "./cache.service.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import config from "../config/env.js";

const SUPPORTED_LAYERS = [
  "roads",
  "hospitals",
  "fireStations",
  "policeStations",
  "emergencyServices",
  "power-substations",
  "powerTransformer",
  "powerLine",
  "powerMinorLine",
  "powerTower",
  "powerPole",
  "waterInfrastructure",
];

const STUDY_AREA_NAMES = ["default"];

// Manually verified infrastructure that is missing from OpenStreetMap.
// Loaded once at startup; future assets are added by editing only this file.
const MANUAL_INFRASTRUCTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "manualInfrastructure.geojson"
);

let manualFeatures = [];

try {
  const raw = readFileSync(MANUAL_INFRASTRUCTURE_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  manualFeatures = Array.isArray(parsed?.features) ? parsed.features : [];
  console.log(`[ManualInfrastructure] Loaded ${manualFeatures.length} manual feature(s)`);
} catch (error) {
  console.error(`[ManualInfrastructure] Could not load dataset: ${error.message}`);
  manualFeatures = [];
}

// Maps a backend layer to the manualType(s) it should be supplemented with.
const MANUAL_LAYER_TYPES = {
  policeStations: ["policeStations"],
  fireStations: ["fireStations"],
  emergencyServices: ["policeStations", "fireStations"],
  waterInfrastructure: ["waterInfrastructure"],
};

const manualTypesForLayer = (layer) => MANUAL_LAYER_TYPES[layer] || [];

const hasManualInfrastructure = (layer) => manualTypesForLayer(layer).length > 0;

// Convert matching manual GeoJSON features into OSM node elements and append
// them to the existing OSM response so the frontend pipeline is untouched.
const mergeManualInfrastructure = (layer, osmData) => {
  const wantedTypes = manualTypesForLayer(layer);

  if (wantedTypes.length === 0) {
    return osmData;
  }

  const features = manualFeatures.filter((feature) =>
    wantedTypes.includes(feature?.properties?.manualType)
  );

  if (features.length === 0) {
    return osmData;
  }

  const baseElements = Array.isArray(osmData?.elements) ? osmData.elements : [];
  // Strip previously merged manual nodes so the merge is idempotent and safe
  // to apply both on cache misses and on cache hits (stale cached OSM data).
  const osmOnly = baseElements.filter((element) => !(element.tags && element.tags.source === "manual"));

  let nextManualId = -1_000_000;

  const manualElements = features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const tags = { ...feature.properties, source: "manual" };
    delete tags.manualType;

    return {
      type: "node",
      id: nextManualId--,
      lat,
      lon,
      tags,
    };
  });

  return {
    ...osmData,
    elements: [...osmOnly, ...manualElements],
  };
};

const enrichFeaturesWithMetadata = (osmData, layer, source = "overpass") => {
  const enrichedFeatures = [];

  for (const element of osmData.elements || []) {
    const enrichedFeature = {
      ...element,
      metadata: {
        ...element.metadata,
        layer,
        sector: (layer === 'roads' ? 'Transportation' :
                layer === 'hospitals' ? 'Healthcare' :
                layer === 'fireStations' ? 'Emergency Services' :
                layer === 'policeStations' ? 'Public Safety' :
                layer === 'emergencyServices' ? 'Emergency Services' :
                layer === 'power-substations' ? 'Energy' :
                layer === 'powerTransformer' ? 'Energy' :
                layer === 'powerLine' ? 'Energy' :
                layer === 'powerMinorLine' ? 'Energy' :
                layer === 'powerTower' ? 'Energy' :
                layer === 'powerPole' ? 'Energy' :
                layer === 'waterInfrastructure' ? 'Water' : null),
        type: (layer === 'roads' ? 'Linear Infrastructure' :
               layer === 'hospitals' ? 'Medical Facility' :
               layer === 'fireStations' ? 'Emergency Response Facility' :
               layer === 'policeStations' ? 'Security Facility' :
               layer === 'emergencyServices' ? 'Coordinated Response Network' :
               layer === 'power-substations' ? 'Power Distribution Hub' :
               layer === 'powerTransformer' ? 'Power Conversion Equipment' :
               layer === 'powerLine' ? 'Electrical Transmission Line' :
               layer === 'powerMinorLine' ? 'Distribution Line' :
               layer === 'powerTower' ? 'Support Structure' :
               layer === 'powerPole' ? 'Support Structure' :
               layer === 'waterInfrastructure' ? 'Water Treatment Plant' : null),
        criticality: (layer === 'roads' ? 'Medium' :
                    layer === 'hospitals' ? 'High' :
                    layer === 'fireStations' ? 'High' :
                    layer === 'policeStations' ? 'High' :
                    layer === 'emergencyServices' ? 'Critical' :
                    layer === 'power-substations' ? 'Critical' :
                    layer === 'powerTransformer' ? 'High' :
                    layer === 'powerLine' ? 'Critical' :
                    layer === 'powerMinorLine' ? 'Medium' :
                    layer === 'powerTower' ? 'Medium' :
                     layer === 'powerPole' ? 'Medium' :
                     layer === 'waterInfrastructure' ? 'Critical' : null),
        dependencyLevel: (layer === 'roads' || layer === 'power-substations' || layer === 'powerTransformer' || layer === 'powerLine' || layer === 'powerMinorLine' || layer === 'powerTower' || layer === 'powerPole' ? 'primary' :
                    layer === 'hospitals' || layer === 'fireStations' || layer === 'policeStations' || layer === 'emergencyServices' ? 'secondary' :
                    layer === 'waterInfrastructure' ? 'primary' : null),
        dependsOn: (layer === 'roads' ? [] :
                   layer === 'hospitals' ? ['roads', 'emergencyServices'] :
                   layer === 'fireStations' ? ['roads', 'hospitals'] :
                   layer === 'policeStations' ? ['roads', 'emergencyServices'] :
                   layer === 'emergencyServices' ? ['hospitals', 'fireStations', 'policeStations'] :
                   layer === 'power-substations' ? ['roads', 'powerTransformer'] :
                   layer === 'powerTransformer' ? ['roads'] :
                   layer === 'powerLine' ? ['roads', 'power-substations'] :
                   layer === 'powerMinorLine' ? ['roads', 'power-substations'] :
                   layer === 'powerTower' ? ['roads', 'powerLine', 'powerMinorLine'] :
                   layer === 'powerPole' ? ['roads', 'powerLine', 'powerMinorLine'] :
                   layer === 'waterInfrastructure' ? ['roads'] :
                   []),
        supports: (layer === 'roads' ? ['hospitals', 'fireStations', 'policeStations', 'emergencyServices', 'power-substations'] :
                   layer === 'hospitals' ? ['emergencyServices'] :
                   layer === 'fireStations' ? ['emergencyServices'] :
                   layer === 'policeStations' ? ['emergencyServices'] :
                   layer === 'emergencyServices' ? [] :
                   layer === 'power-substations' ? ['powerLine', 'powerMinorLine', 'powerTower', 'powerPole'] :
                   layer === 'powerTransformer' ? [] :
                   layer === 'powerLine' ? ['powerTower', 'powerPole'] :
                   layer === 'powerMinorLine' ? ['powerTower', 'powerPole'] :
                   layer === 'powerTower' ? [] :
                   layer === 'powerPole' ? [] :
                   layer === 'waterInfrastructure' ? [] :
                   []),
        defaultStatus: 'operational',
        lastUpdated: null,
        dataQuality: 'verified',
        verificationStatus: source === 'manual' ? 'manual' : 'overpass',
        coordinatePrecision: 'high',
      },
    };

    if (source === 'manual') {
      enrichedFeature.metadata.verificationStatus = 'manual';
    }

    enrichedFeatures.push(enrichedFeature);
  }

  return {
    ...osmData,
    elements: enrichedFeatures,
  };
};

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
      const merged = mergeManualInfrastructure(layer, cached);
      const hasManual = cached.elements?.some((e) => e.tags?.source === "manual") || hasManualInfrastructure(layer);
      return enrichFeaturesWithMetadata(merged, layer, hasManual ? "manual" : "overpass");
    }
  } catch {
    // Cache read failures must not crash the application.
  }

  console.log(`[Overpass] Fetch ${layer}/${studyAreaName}`);
  let osmData;

  try {
    const query = buildQuery(layer, polygon);
    osmData = await requestOverpass(query, signal);
    console.log(`[Overpass] Success`);
  } catch (error) {
    console.error(`[Overpass] Failed for ${layer}/${studyAreaName}: ${error.message}`);

    // Manually verified infrastructure must remain available even when the
    // primary OSM source is unreachable. Layers without manual supplements
    // keep their original failure behaviour.
    if (!hasManualInfrastructure(layer)) {
      throw error;
    }

    osmData = { elements: [] };
  }

  const merged = mergeManualInfrastructure(layer, osmData);

  const hasManual = osmData.elements?.some((e) => e.tags?.source === "manual") || hasManualInfrastructure(layer);
  const enrichedData = enrichFeaturesWithMetadata(merged, layer, hasManual ? "manual" : "overpass");

  try {
    await saveCache(layer, studyAreaName, enrichedData);
  } catch {
    // Cache write failures must not crash the application.
  }

  return enrichedData;
};

export { mergeManualInfrastructure, enrichFeaturesWithMetadata };