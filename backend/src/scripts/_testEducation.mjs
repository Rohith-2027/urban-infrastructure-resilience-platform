import { OVERPASS_ENDPOINTS, USER_AGENT } from "../constants/overpass.constants.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const polygon = toOverpassPolygon(getStudyArea("default"));
const query = `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out center;`;

console.log("Query:", query);
console.log("\nTrying Overpass endpoints...");

for (const endpoint of OVERPASS_ENDPOINTS) {
  try {
    console.log(`\n${endpoint}:`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log(`  Status: ${response.status}`);
    const text = await response.text();
    if (text.startsWith("<!")) {
      console.log(`  HTML error response (first 200 chars): ${text.substring(0, 200)}`);
      continue;
    }
    const data = JSON.parse(text);
    console.log(`  Elements: ${data.elements?.length ?? "none"}`);
    if (data.elements?.length > 0) {
      console.log(`  First element:`, JSON.stringify(data.elements[0], null, 2).substring(0, 500));
    }
    break;
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}
