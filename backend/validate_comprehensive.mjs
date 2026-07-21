import mongoose from "mongoose";
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(__dirname, "..");
const BACKEND_DIR = __dirname;
const FRONTEND_DIR = join(PROJECT_DIR, "frontend");
const BACKEND_LAYERS = ["roads", "hospitals", "fireStations", "policeStations", "emergencyServices", "powerSubstations", "waterInfrastructure", "education", "trafficManagement"];
const REQUIRED_METADATA_FIELDS = ["sector", "type", "criticality", "dependencyLevel", "dependsOn", "supports", "defaultStatus"];

let passed = 0;
let failed = 0;
let issues = [];

const check = (label, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    issues.push({ label, detail });
  }
};

// ── 1. Validate infrastructureMetadata.json ──────────────────────────────
console.log("\n[1] infrastructureMetadata.json Validation");
console.log("─".repeat(50));

const metadataPath = join(BACKEND_DIR, "config", "infrastructureMetadata.json");
const metadata = JSON.parse(readFileSync(metadataPath, "utf-8"));

// Check infrastructureTypes has all backend layers
check("infrastructureTypes key exists", !!metadata.infrastructureTypes, "Missing infrastructureTypes key");
const infraTypes = metadata.infrastructureTypes || {};
for (const layer of BACKEND_LAYERS) {
  check(`Layer '${layer}' in infrastructureTypes`, !!infraTypes[layer], `Missing from infrastructureTypes`);
  if (infraTypes[layer]) {
    const entry = infraTypes[layer];
    for (const field of REQUIRED_METADATA_FIELDS) {
      check(`  ${layer}.${field} exists`, entry[field] !== undefined && entry[field] !== null, `Missing ${field}`);
    }
  }
}

check("No obsolete layers in infrastructureTypes", 
  !["powerPole", "powerTower", "powerMinorLine", "powerTransformer"].some(l => infraTypes[l]),
  "Obsolete layers still present");

check("No hyphenated IDs in infrastructureTypes",
  !["power-substations", "fire-stations", "police-stations", "water-infrastructure", "emergency-services"].some(l => infraTypes[l]),
  "Hyphenated IDs still present");

// ── 2. Validate overpass.service.js QUERIES ──────────────────────────────
console.log("\n[2] Overpass QUERIES Validation");
console.log("─".repeat(50));

const overpassSrc = readFileSync(join(BACKEND_DIR, "src", "services", "overpass.service.js"), "utf-8");
const queryMatch = overpassSrc.match(/const QUERIES = \{([^}]+)\}/s);
check("QUERIES object exists", !!queryMatch);
if (queryMatch) {
  for (const layer of BACKEND_LAYERS) {
    const hasQuery = overpassSrc.includes(`${layer}:`);
    check(`Query exists for '${layer}'`, hasQuery, `Missing Overpass query`);
  }
}

// Check no obsolete queries
const obsoleteQueries = ["powerTransformer", "powerMinorLine", "powerTower", "powerPole", "power-substations"];
for (const oq of obsoleteQueries) {
  const hasOldQuery = overpassSrc.includes(`${oq}:`);
  check(`No obsolete query '${oq}'`, !hasOldQuery, `Still has old query`);
}

// ── 3. Validate infrastructure.service.js SUPPORTED_LAYERS ───────────────
console.log("\n[3] SUPPORTED_LAYERS & enrichFeaturesWithMetadata Validation");
console.log("─".repeat(50));

const infraServiceSrc = readFileSync(join(BACKEND_DIR, "src", "services", "infrastructure.service.js"), "utf-8");

for (const layer of BACKEND_LAYERS) {
  const inSupported = new RegExp(`"${layer}"`).test(infraServiceSrc);
  check(`Layer '${layer}' in SUPPORTED_LAYERS`, inSupported, `Not found in SUPPORTED_LAYERS`);
}

// Check enrichFeaturesWithMetadata covers all layers
for (const layer of BACKEND_LAYERS) {
  const layerInEnrich = infraServiceSrc.includes(`layer === '${layer}'`);
  check(`enrichFeaturesWithMetadata handles '${layer}'`, layerInEnrich, `Missing metadata enrichment for ${layer}`);
}

// ── 4. Validate HTTP Status Code Coverage ────────────────────────────────
console.log("\n[4] HTTP Error Handling Validation");
console.log("─".repeat(50));

const controllerSrc = readFileSync(join(BACKEND_DIR, "src", "controllers", "infrastructure.controller.js"), "utf-8");
check("Controller handles 400 (invalid layer)", /status\(400\)/.test(controllerSrc), "Missing 400 handler");
check("Controller returns 502 fallback", /status\(502\)/.test(controllerSrc), "Missing 502 fallback");
check("Empty FeatureCollection returned on Overpass failure",
  /return \{ type: "FeatureCollection", features: \[\] \};/.test(infraServiceSrc),
  "Missing empty FeatureCollection return on Overpass failure");
check("Cache fallback on Overpass failure",
  /Returning cached fallback/.test(infraServiceSrc),
  "Missing cache fallback on Overpass failure");

// ── 5. Validate Cache Service ────────────────────────────────────────────
console.log("\n[5] Cache Service Validation");
console.log("─".repeat(50));

const cacheSrc = readFileSync(join(BACKEND_DIR, "src", "services", "cache.service.js"), "utf-8");
check("cleanObsoleteCache exported", cacheSrc.includes("export const cleanObsoleteCache"), "Missing cleanObsoleteCache");
const obsoleteList = ["powerPole", "powerTower", "powerMinorLine", "powerTransformer", "powerLine", "power-substations", "powerSubstationsCombined", "fire-stations", "police-stations", "water-infrastructure", "emergency-services"];
for (const obs of obsoleteList) {
  check(`Obsolete layer '${obs}' in cleanup list`, cacheSrc.includes(`"${obs}"`), `Missing from OBSOLETE_LAYER_NAMES`);
}

// ── 6. Validate Frontend layerRegistry.js ───────────────────────────────
console.log("\n[6] Frontend Layer Registry Validation");
console.log("─".repeat(50));

const registrySrc = readFileSync(join(FRONTEND_DIR, "src", "gis", "config", "layerRegistry.js"), "utf-8");
const activeFrontendLayers = ["roads", "hospitals", "fireStations", "policeStations", "powerSubstations", "waterInfrastructure", "education", "emergencyServices", "trafficManagement"];
for (const layer of activeFrontendLayers) {
  check(`Frontend registry has '${layer}'`, registrySrc.includes(`id: "${layer}"`), `Missing in LAYER_REGISTRY`);
}

// Check obsolete layers removed from registry
const obsoleteFrontend = ["powerTransformer", "powerMinorLine", "powerTower", "powerPole", "powerSubstationsCombined"];
for (const obs of obsoleteFrontend) {
  check(`No obsolete '${obs}' in registry`, !registrySrc.includes(`id: "${obs}"`), `Still present in LAYER_REGISTRY`);
}

// Check hyphenated IDs removed from registry
const hyphenatedIds = ["fire-stations", "police-stations", "power-substations", "water-infrastructure", "emergency-services"];
for (const hid of hyphenatedIds) {
  check(`No hyphenated ID '${hid}' in registry`, !registrySrc.includes(`id: "${hid}"`), `Still present in LAYER_REGISTRY`);
}

// Check all active layers have providers
for (const layer of activeFrontendLayers) {
  const idRegex = new RegExp(`\\bid: "${layer}"[,}]`);
  const match = idRegex.exec(registrySrc);
  const sectionAfter = match ? registrySrc.slice(match.index, match.index + 1000) : "";
  check(`'${layer}' has provider`, /provider:/.test(sectionAfter), `Missing provider for ${layer}`);
}

// ── 7. Validate Frontend api.js ──────────────────────────────────────────
console.log("\n[7] Frontend API Mappings Validation");
console.log("─".repeat(50));

const apiSrc = readFileSync(join(FRONTEND_DIR, "src", "config", "api.js"), "utf-8");
for (const layer of BACKEND_LAYERS) {
  check(`api.js maps '${layer}'`, new RegExp(`${layer}: "`).test(apiSrc), `Missing mapping for ${layer}`);
}

// ── 8. Validate Frontend infrastructureService.js ────────────────────────
console.log("\n[8] Frontend Infrastructure Service Validation");
console.log("─".repeat(50));

const infraFrontendSrc = readFileSync(join(FRONTEND_DIR, "src", "infrastructure", "services", "infrastructureService.js"), "utf-8");
check("overpassRoadsToGeoJSON exists", infraFrontendSrc.includes("overpassRoadsToGeoJSON"), "Missing roads adapter");
check("overpassPointFeaturesToGeoJSON exists", infraFrontendSrc.includes("overpassPointFeaturesToGeoJSON"), "Missing point features adapter");

const adapterLayers = ["roads", "hospitals", "fireStations", "policeStations", "emergencyServices", "powerSubstations", "waterInfrastructure", "education", "trafficManagement"];
for (const layer of adapterLayers) {
  check(`standardizationAdapter has '${layer}'`, infraFrontendSrc.includes(`${layer}: `), `Missing adapter entry for ${layer}`);
}

// ── 9. Validate warmup script ────────────────────────────────────────────
console.log("\n[9] Warmup Script Validation");
console.log("─".repeat(50));

const warmupSrc = readFileSync(join(BACKEND_DIR, "src", "scripts", "warmupInfrastructureCache.js"), "utf-8");
for (const layer of BACKEND_LAYERS) {
  check(`Warmup script includes '${layer}'`, new RegExp(`\\b${layer}: "`).test(warmupSrc), `Missing from DISPLAY_NAMES`);
}
check("No obsolete layers in warmup", 
  !["power-substations", "powerTransformer", "powerMinorLine", "powerTower", "powerPole"].some(l => warmupSrc.includes(`"${l}"`)),
  "Obsolete layers in warmup DISPLAY_NAMES");

// ── 10. Run API endpoint checks ──────────────────────────────────────────
console.log("\n[10] Running API Endpoint Checks (requires MongoDB)");
console.log("─".repeat(50));

let apiResults = {};
try {
  const mongodbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/urban_infrastructure_resilience";
  await mongoose.connect(mongodbUri);
  check("MongoDB connection successful", true);

  // Verify only valid layer cache entries exist
  const cacheSchema = new mongoose.Schema({ layer: String, studyArea: String, data: mongoose.Schema.Types.Mixed, lastFetched: Date }, { timestamps: true });
  const InfrastructureCache = mongoose.models.InfrastructureCache || mongoose.model("InfrastructureCache", cacheSchema);
  const allEntries = await InfrastructureCache.find({}).lean();
  const validLayers = new Set(BACKEND_LAYERS);
  const invalidEntries = allEntries.filter(e => !validLayers.has(e.layer));
  
  check(`All ${allEntries.length} cache entries are for valid layers`, invalidEntries.length === 0,
    invalidEntries.length > 0 ? `Found ${invalidEntries.length} invalid: ${invalidEntries.map(e => e.layer).join(", ")}` : "");

  // Check no duplicate (layer+studyArea) pairs
  const seen = new Set();
  let duplicates = 0;
  for (const entry of allEntries) {
    const key = `${entry.layer}:${entry.studyArea}`;
    if (seen.has(key)) duplicates++;
    seen.add(key);
  }
  check("No duplicate cache entries", duplicates === 0, `Found ${duplicates} duplicate(s)`);

  // Check each valid layer has a cache entry (empty data won't be cached — that's expected)
  for (const layer of BACKEND_LAYERS) {
    const hasEntry = allEntries.some(e => e.layer === layer && e.studyArea === "default");
    if (hasEntry) {
      passed++;
      console.log(`  ✓ Cache entry exists for '${layer}'`);
    } else {
      console.log(`  ~ '${layer}' — no cache entry (expected if data was empty)`);
    }
  }

  // Verify cache data structure
  for (const layer of BACKEND_LAYERS) {
    const entry = allEntries.find(e => e.layer === layer && e.studyArea === "default");
    if (entry) {
      check(`  ${layer} cache has data`, !!entry.data, "Data is null/undefined");
      check(`  ${layer} cache has lastFetched`, !!entry.lastFetched, "Missing lastFetched timestamp");
    }
  }

  await mongoose.disconnect();
} catch (err) {
  check("MongoDB/Mongoose checks", false, err.message);
}

// ── SUMMARY ──────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(50));
console.log("VALIDATION SUMMARY");
console.log("=".repeat(50));
console.log(`  Total checks  : ${passed + failed}`);
console.log(`  Passed        : ${passed}`);
console.log(`  Failed        : ${failed}`);

if (issues.length > 0) {
  console.log("\n  Issues Found:");
  for (const issue of issues) {
    console.log(`    ✗ ${issue.label}${issue.detail ? `\n      ${issue.detail}` : ""}`);
  }
}

console.log(`\n  ${failed === 0 ? "ALL CHECKS PASSED ✓" : `${failed} CHECK(S) FAILED — SEE ABOVE`}`);
