import { USER_AGENT } from "../constants/overpass.constants.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const polygon = toOverpassPolygon(getStudyArea("default"));
const endpoint = "https://overpass-api.de/api/interpreter";

async function tryQuery(label, query) {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!r.ok) {
      const text = await r.text();
      const msgMatch = text.match(/<p[^>]*>(.*?)<\/p>/s);
      console.log(`${label}: HTTP ${r.status} - ${msgMatch?.[1]?.trim() || text.substring(0, 200)}`);
      return;
    }
    const data = await r.json();
    console.log(`${label}: ${data.elements?.length ?? 0} elements`);
    if (data.elements?.length > 0) {
      data.elements.slice(0, 3).forEach(e => console.log(`  ${e.type}/${e.id}: ${e.tags?.name || '(unnamed)'}`));
    }
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

// Test variations
await tryQuery("A: node+way, out center",
  `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out center;`);

await tryQuery("B: node+way, out body",
  `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out body;`);

await tryQuery("C: node only, out body",
  `[out:json][timeout:30];node["amenity"~"school|college|university"](poly:"${polygon}");out body;`);

await tryQuery("D: way only, out geom",
  `[out:json][timeout:30];way["amenity"~"school|college|university"](poly:"${polygon}");out geom;`);

await tryQuery("E: way only, out center",
  `[out:json][timeout:30];way["amenity"~"school|college|university"](poly:"${polygon}");out center;`);

await tryQuery("F: node+way, out tags",
  `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out tags;`);
