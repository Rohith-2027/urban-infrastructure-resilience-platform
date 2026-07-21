import { USER_AGENT } from "../constants/overpass.constants.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const polygon = toOverpassPolygon(getStudyArea("default"));
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function tryQuery(label, query) {
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      console.log(`${label} (${ep.split('//')[1].split('/')[0]}): ${data.elements?.length ?? 0} elements`);
      if (data.elements?.length > 0) {
        data.elements.slice(0, 3).forEach(e => console.log(`  ${e.type}/${e.id}: ${e.tags?.name || '(unnamed)'}`));
      }
      return;
    } catch { continue; }
  }
  console.log(`${label}: all endpoints failed`);
}

// Individual queries that work
await tryQuery("nodes",
  `[out:json][timeout:30];node["amenity"~"school|college|university"](poly:"${polygon}");out body;`);

// Try way query with each endpoint separately  
await tryQuery("ways (out center)",
  `[out:json][timeout:30];way["amenity"~"school|college|university"](poly:"${polygon}");out center;`);

// The actual fix: run two separate queries and merge
console.log("\n--- Approach: two separate queries ---");
let allElements = [];

for (const ep of endpoints) {
  try {
    const q = `[out:json][timeout:30];node["amenity"~"school|college|university"](poly:"${polygon}");out body;`;
    const r = await fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
      body: `data=${encodeURIComponent(q)}`,
      signal: AbortSignal.timeout(30000),
    });
    if (r.ok) {
      const data = await r.json();
      allElements = data.elements || [];
      console.log(`Node query: ${allElements.length} elements`);
      break;
    }
  } catch { continue; }
}

console.log(`Total education features: ${allElements.length}`);
allElements.forEach(e => console.log(`  ${e.type}/${e.id}: ${e.tags?.name || '(unnamed)'}`));
