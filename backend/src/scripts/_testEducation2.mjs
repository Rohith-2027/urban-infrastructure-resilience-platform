import { USER_AGENT } from "../constants/overpass.constants.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const polygon = toOverpassPolygon(getStudyArea("default"));

// Test 1: The exact query from the backend
const q1 = `[out:json][timeout:30];(node["amenity"~"school|college|university"](poly:"${polygon}");way["amenity"~"school|college|university"](poly:"${polygon}"));out center;`;
console.log("Query 1 (current):", q1.substring(0, 120), "...");

const endpoint = "https://overpass-api.de/api/interpreter";
try {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(q1)}`,
  });
  console.log("Status:", r.status);
  const text = await r.text();
  console.log("Response (first 500):", text.substring(0, 500));
} catch (err) {
  console.log("Error:", err.message);
}

// Test 2: Simplified query with just node
const q2 = `[out:json][timeout:30];node["amenity"~"school|college|university"](poly:"${polygon}");out body;`;
console.log("\n\nQuery 2 (node only, out body):", q2.substring(0, 120), "...");
try {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(q2)}`,
  });
  console.log("Status:", r.status);
  const data = await r.json();
  console.log("Elements:", data.elements?.length);
  if (data.elements?.length > 0) {
    console.log("First:", JSON.stringify(data.elements[0]).substring(0, 300));
  }
} catch (err) {
  console.log("Error:", err.message);
}
