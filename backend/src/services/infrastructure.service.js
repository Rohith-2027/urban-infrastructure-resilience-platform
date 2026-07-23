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
  "powerSubstations",
  "waterInfrastructure",
  "education",
  "communication",
  "trafficManagement",
];

const STUDY_AREA_NAMES = ["default"];

const MANUAL_INFRASTRUCTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "manualInfrastructure.geojson"
);

const MANUAL_COMMUNICATION_INFRASTRUCTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "manualCommunicationInfrastructure.geojson"
);

const MANUAL_TRAFFIC_MANAGEMENT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "manualTrafficManagement.geojson"
);

const MANUAL_POWER_SUBSTATIONS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "manualPowerSubstations.geojson"
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

let manualCommunicationFeatures = [];

try {
  const raw = readFileSync(MANUAL_COMMUNICATION_INFRASTRUCTURE_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  manualCommunicationFeatures = Array.isArray(parsed?.features) ? parsed.features : [];
  console.log(`[ManualCommunicationInfrastructure] Loaded ${manualCommunicationFeatures.length} manual feature(s)`);
} catch (error) {
  console.error(`[ManualCommunicationInfrastructure] Could not load dataset: ${error.message}`);
  manualCommunicationFeatures = [];
}

let manualTrafficFeatures = [];

try {
  const raw = readFileSync(MANUAL_TRAFFIC_MANAGEMENT_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  manualTrafficFeatures = Array.isArray(parsed?.features) ? parsed.features : [];
  console.log(`[ManualTrafficManagement] Loaded ${manualTrafficFeatures.length} manual feature(s)`);
} catch (error) {
  console.error(`[ManualTrafficManagement] Could not load dataset: ${error.message}`);
  manualTrafficFeatures = [];
}

let manualPowerSubstationFeatures = [];

try {
  const raw = readFileSync(MANUAL_POWER_SUBSTATIONS_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  manualPowerSubstationFeatures = Array.isArray(parsed?.features) ? parsed.features : [];
  console.log(`[ManualPowerSubstations] Loaded ${manualPowerSubstationFeatures.length} manual feature(s)`);
} catch (error) {
  console.error(`[ManualPowerSubstations] Could not load dataset: ${error.message}`);
  manualPowerSubstationFeatures = [];
}

const MANUAL_LAYER_TYPES = {
  policeStations: ["policeStations"],
  fireStations: ["fireStations"],
  waterInfrastructure: ["waterInfrastructure"],
  communication: ["communication"],
  trafficManagement: ["trafficManagement"],
  powerSubstations: ["powerSubstations"],
};

/** Layers served entirely from manual GeoJSON — no Overpass query. */
const MANUAL_ONLY_LAYERS = new Set(["fireStations", "policeStations", "waterInfrastructure", "communication", "trafficManagement", "powerSubstations"]);

const manualTypesForLayer = (layer) => MANUAL_LAYER_TYPES[layer] || [];

const hasManualInfrastructure = (layer) => manualTypesForLayer(layer).length > 0;

export const mergeManualInfrastructure = (layer, osmData) => {
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

export const enrichFeaturesWithMetadata = (osmData, layer, source = "overpass") => {
  const enrichedFeatures = [];
  const counters = {};

  for (const element of osmData.elements || []) {
    const tags = element.tags || {};
    counters[layer] = (counters[layer] || 0) + 1;
    const seq = String(counters[layer]).padStart(3, "0");

    const sectorMap = {
      roads: "Transportation", hospitals: "Healthcare", fireStations: "Emergency Services",
      policeStations: "Public Safety", powerSubstations: "Energy", waterInfrastructure: "Water",
      education: "Education", communication: "Communication", trafficManagement: "Transportation",
    };

    const typeMap = {
      roads: "Road", hospitals: "Hospital", fireStations: "Fire Station",
      policeStations: "Police Station", powerSubstations: "Power Substation",
      waterInfrastructure: "Water Infrastructure", education: "Educational Institution",
      communication: "Communication Infrastructure", trafficManagement: "Traffic Management",
    };

    const criticalityMap = {
      roads: "Medium", hospitals: "High", fireStations: "High", policeStations: "High",
      powerSubstations: "Critical", waterInfrastructure: "Critical", education: "Medium",
      communication: "High", trafficManagement: "High",
    };

    const riskScoreDefaults = {
      roads: 40, hospitals: 75, fireStations: 80, policeStations: 80,
      powerSubstations: 90, waterInfrastructure: 90, education: 45,
      communication: 70, trafficManagement: 65,
    };

    const recoveryTimeDefaults = {
      roads: 120, hospitals: 180, fireStations: 90, policeStations: 90,
      powerSubstations: 240, waterInfrastructure: 240, education: 120,
      communication: 180, trafficManagement: 60,
    };

    const resolveName = () => {
      if (tags.name) return tags.name;
      if (tags.ref) return tags.ref;
      if (tags.alt_name) return tags.alt_name;
      if (tags.loc_name) return tags.loc_name;
      if (layer === "roads") return "Unnamed Road";
      return tags.name || null;
    };

    const enrichedFeature = {
      ...element,
      metadata: {
        ...element.metadata,
        layer,
        nodeId: (tags.nodeId) || `${layer.charAt(0).toUpperCase() + layer.slice(1)}-${seq}`,
        sector: sectorMap[layer] || null,
        infrastructureType: typeMap[layer] || null,
        criticality: criticalityMap[layer] || null,
        dependencyLevel: (layer === "roads" || layer === "powerSubstations" ? "primary" :
                layer === "hospitals" || layer === "fireStations" || layer === "policeStations" ? "secondary" :
                layer === "waterInfrastructure" ? "primary" :
                layer === "education" ? "secondary" :
                layer === "communication" ? "critical" :
                layer === "trafficManagement" ? "secondary" : null),
        dependsOn: (layer === "roads" ? [] :
                layer === "hospitals" ? ["powerSubstations", "waterInfrastructure", "communication"] :
                layer === "fireStations" ? ["powerSubstations", "waterInfrastructure", "communication"] :
                layer === "policeStations" ? ["powerSubstations", "waterInfrastructure", "communication"] :
                layer === "powerSubstations" ? [] :
                layer === "waterInfrastructure" ? ["powerSubstations"] :
                layer === "education" ? ["powerSubstations", "waterInfrastructure"] :
                layer === "communication" ? ["powerSubstations"] :
                layer === "trafficManagement" ? ["powerSubstations", "communication"] :
                []),
        supports: (layer === "roads" ? [] :
                layer === "hospitals" ? [] :
                layer === "fireStations" ? [] :
                layer === "policeStations" ? [] :
                layer === "powerSubstations" ? ["hospitals", "fireStations", "policeStations", "education", "communication", "waterInfrastructure", "trafficManagement"] :
                layer === "waterInfrastructure" ? ["hospitals", "fireStations", "policeStations", "education"] :
                layer === "education" ? [] :
                layer === "communication" ? ["hospitals", "fireStations", "policeStations", "trafficManagement"] :
                layer === "trafficManagement" ? [] :
                []),
        name: resolveName(),
        status: tags.status || "operational",
        failureState: tags.failureState || "Operational",
        riskScore: tags.riskScore != null ? Number(tags.riskScore) : riskScoreDefaults[layer] || 50,
        estimatedRecoveryTime: tags.estimatedRecoveryTime != null ? Number(tags.estimatedRecoveryTime) : recoveryTimeDefaults[layer] || 120,
        source: source,
        verificationStatus: source === "manual" ? "manual" : "unverified",
        coordinatePrecision: "high",
      },
    };

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

/** Build manual-only layer data directly from GeoJSON files (no Overpass). */
const fetchManualLayerData = (layer) => {
  const wantedTypes = manualTypesForLayer(layer);

  let features;

  if (layer === "communication") {
    features = manualCommunicationFeatures.filter((f) =>
      wantedTypes.includes(f?.properties?.manualType)
    );
  } else if (layer === "trafficManagement") {
    features = manualTrafficFeatures.filter((f) =>
      wantedTypes.includes(f?.properties?.manualType)
    );
  } else if (layer === "powerSubstations") {
    features = manualPowerSubstationFeatures.filter((f) =>
      wantedTypes.includes(f?.properties?.manualType)
    );
  } else {
    features = manualFeatures.filter((f) =>
      wantedTypes.includes(f?.properties?.manualType)
    );
  }

  let nextManualId = -1_000_000;

  const elements = features.map((feature) => {
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

  const enriched = enrichFeaturesWithMetadata({ elements }, layer, "manual");

  console.log(
    `[ManualData] ${layer}: ${elements.length} feature(s)`
  );

  return enriched;
};

/** Fetch infrastructure data for a validated layer and study area polygon. */
export const fetchInfrastructureData = async (layer, polygon, signal) => {
  if (!isValidLayer(layer)) {
    throw new Error(`Invalid layer: ${layer}`);
  }

  if (MANUAL_ONLY_LAYERS.has(layer)) {
    const data = fetchManualLayerData(layer);

    console.log(
        `[Manual] ${layer}: ${data.elements.length} feature(s) loaded`
    );

    return data;
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
    // Cache read failures must not crash.
  }

  console.log(`[Overpass] Fetch ${layer}/${studyAreaName}`);
  let osmData;

  try {
    const queryResult = buildQuery(layer, polygon);

    if (Array.isArray(queryResult)) {
      const results = await Promise.all(queryResult.map((query) => requestOverpass(query, signal)));
      osmData = { elements: results.flatMap((r) => r.elements || []) };
    } else {
      osmData = await requestOverpass(queryResult, signal);
    }

    console.log(`[Overpass] Success`);
  } catch (error) {
    console.error(`[Overpass] Failed for ${layer}/${studyAreaName}: ${error.message}`);

    // Return cached data if available; otherwise return empty FeatureCollection.
    try {
      const cached = await getCache(layer, studyAreaName);
      if (cached) {
        console.log(`[Overpass] Returning cached fallback for ${layer}/${studyAreaName}`);
        const merged = mergeManualInfrastructure(layer, cached);
        const hasManual = cached.elements?.some((e) => e.tags?.source === "manual") || hasManualInfrastructure(layer);
        return enrichFeaturesWithMetadata(merged, layer, hasManual ? "manual" : "overpass");
      }
    } catch {
      // Cache read failures must not crash.
    }

    console.log(`[Overpass] No cache fallback available for ${layer}/${studyAreaName}, returning empty collection`);
    return { type: "FeatureCollection", features: [] };
  }

  const merged = mergeManualInfrastructure(layer, osmData);

  const hasManual = osmData.elements?.some((e) => e.tags?.source === "manual") || hasManualInfrastructure(layer);
  const enrichedData = enrichFeaturesWithMetadata(merged, layer, hasManual ? "manual" : "overpass");

  if (enrichedData && enrichedData.elements && enrichedData.elements.length > 0) {
    try {
      await saveCache(layer, studyAreaName, enrichedData);
    } catch {
      // Cache write failures must not crash.
    }
  }

  return enrichedData;
};


