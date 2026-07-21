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
      // Extract error message from HTML
      const errMatch = text.match(/<strong[^>]*>(.*?)<\/strong>/s) || text.match(/<p>(.*?)<\/p>/s);
      console.log(`${label}: HTTP ${r.status} - ${errMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'unknown error'}`);
      return;
    }
    const data = await r.json();
    console.log(`${label}: ${data.elements?.length ?? 0} elements`);
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

// Test if it's the union syntax causing the issue
await tryQuery("1: simple union no regex",
  `[out:json][timeout:30];(node["amenity"="school"](poly:"${polygon}");way["amenity"="school"](poly:"${polygon}"));out body;`);

await tryQuery("2: node regex, way exact",
  `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"="school"](poly:"${polygon}"));out body;`);

await tryQuery("3: two separate node queries",
  `[out:json][timeout:30];(node["amenity"="school"](poly:"${polygon}");node["amenity"="college"](poly:"${polygon}");node["amenity"="university"](poly:"${polygon}"));out body;`);

await tryQuery("4: just node with regex (confirmed working)",
  `[out:json][timeout:30];node["amenity"~"school|college|university"](poly:"${polygon}");out body;`);

// Also test: maybe the combined query is too complex and needs a higher timeout
await tryQuery("5: node+way regex with 60s timeout",
  `[out:json][timeout:60];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out body;`);
