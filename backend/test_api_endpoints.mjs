const LAYERS = ["roads","hospitals","fireStations","policeStations","emergencyServices","powerSubstations","waterInfrastructure","education","trafficManagement"];
const BASE = "http://localhost:5000/api/infrastructure";

let passed = 0;
let failed = 0;

const check = (label, ok, detail = "") => {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label} — ${detail}`); }
};

const fetch = async (url, timeoutMs = 60000) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await globalThis.fetch(url, { signal: ac.signal });
    const text = await res.text();
    clearTimeout(timer);
    return { status: res.status, body: text };
  } catch (e) {
    clearTimeout(timer);
    return { status: 0, body: e.message };
  }
};

(async () => {
  // ── A. Health Check ──────────────────────────────────────────────
  console.log("\n[A] Health Check");
  console.log("─".repeat(50));
  const health = await fetch(`${BASE}/`);
  check("Health endpoint returns 200", health.status === 200, `Got ${health.status}`);
  try {
    const healthJson = JSON.parse(health.body);
    check("Health response has message", !!healthJson.message);
  } catch { check("Health response is valid JSON", false, "Parse error"); }

  // ── B. Each Layer Endpoint ───────────────────────────────────────
  console.log("\n[B] Layer Endpoints");
  console.log("─".repeat(50));
  for (const layer of LAYERS) {
    console.log(`\n  --- ${layer} ---`);
    const res = await fetch(`${BASE}/${layer}?studyArea=default`, 90000);
    check(`${layer}: HTTP 200`, res.status === 200, `Got ${res.status}: ${res.body.slice(0, 200)}`);
    
    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        
        // Could be FeatureCollection (from empty/fallback) or enriched OSM format
        if (data.type === "FeatureCollection") {
          check(`${layer}: FeatureCollection returned`, true);
          check(`${layer}: features is array`, Array.isArray(data.features), typeof data.features);
          console.log(`    → FeatureCollection with ${data.features.length} features`);
        } else if (data.elements) {
          check(`${layer}: OSM response with elements`, true);
          const count = data.elements.length;
          console.log(`    → ${count} elements`);
          
          // Check metadata enrichment for elements with metadata
          const enriched = data.elements.filter(e => e.metadata);
          if (enriched.length > 0) {
            const sample = enriched[0];
            check(`${layer}: metadata.layer exists`, sample.metadata.layer === layer, `Got ${sample.metadata.layer}`);
            check(`${layer}: metadata.sector exists`, !!sample.metadata.sector, `Got null`);
            check(`${layer}: metadata.type exists`, !!sample.metadata.type, `Got null`);
            check(`${layer}: metadata.criticality exists`, !!sample.metadata.criticality, `Got null`);
            check(`${layer}: metadata.dependencyLevel exists`, !!sample.metadata.dependencyLevel, `Got null`);
            check(`${layer}: metadata.dependsOn exists`, Array.isArray(sample.metadata.dependsOn), `Got ${typeof sample.metadata.dependsOn}`);
            check(`${layer}: metadata.supports exists`, Array.isArray(sample.metadata.supports), `Got ${typeof sample.metadata.supports}`);
            check(`${layer}: metadata.defaultStatus exists`, !!sample.metadata.defaultStatus, `Got null`);
            check(`${layer}: metadata.verificationStatus exists`, !!sample.metadata.verificationStatus, `Got null`);
            check(`${layer}: metadata.coordinatePrecision exists`, !!sample.metadata.coordinatePrecision, `Got null`);
            console.log(`    → ${enriched.length}/${count} enriched | sector=${sample.metadata.sector} | criticality=${sample.metadata.criticality} | dep=${sample.metadata.dependencyLevel} | on=${sample.metadata.dependsOn} | sup=${sample.metadata.supports}`);
          }
          
          // Check for manual features
          const manual = data.elements.filter(e => e.tags && e.tags.source === "manual");
          if (manual.length > 0) {
            console.log(`    → ${manual.length} manual feature(s) merged`);
          }
        } else {
          check(`${layer}: unexpected response format`, false, JSON.stringify(data).slice(0, 200));
        }
      } catch (e) {
        check(`${layer}: valid JSON response`, false, e.message);
      }
    }
  }

  // ── C. Error Handling ────────────────────────────────────────────
  console.log("\n[C] Error Handling");
  console.log("─".repeat(50));
  
  const badLayer = await fetch(`${BASE}/nonexistentLayer?studyArea=default`);
  check("Invalid layer returns 400", badLayer.status === 400, `Got ${badLayer.status}`);
  try { const b = JSON.parse(badLayer.body); check("400 body has error field", !!b.error); } catch { check("400 is JSON", false); }
  
  const badStudy = await fetch(`${BASE}/roads?studyArea=nonexistent`);
  check("Invalid study area returns 400", badStudy.status === 400, `Got ${badStudy.status}`);
  
  // ── D. Second Hit (cache) ───────────────────────────────────────
  console.log("\n[D] Cache Verification (second hit)");
  console.log("─".repeat(50));
  for (const layer of ["roads", "hospitals", "fireStations"]) {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/${layer}?studyArea=default`, 30000);
    const elapsed = Date.now() - t0;
    check(`${layer}: cache hit returns 200`, res.status === 200, `Got ${res.status}`);
    console.log(`    → ${elapsed}ms (cache hit should be fast)`);
  }

  // ── SUMMARY ──────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("API ENDPOINT TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`  Total: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  ${failed === 0 ? "ALL CHECKS PASSED" : "FAILURES DETECTED"}`);
})();
