import { fetchInfrastructureData } from "./backend/src/services/infrastructure.service.js";
import { toOverpassPolygon, getStudyArea } from "./backend/src/utils/studyAreas.js";

const area = getStudyArea("default");
const polygon = toOverpassPolygon(area);

const layer = "emergencyServices";
try {
  const data = await fetchInfrastructureData(layer, polygon);
  const manual = (data.elements || []).filter((e) => e.tags && e.tags.source === "manual");
  console.log(`=== ${layer} ===`);
  console.log(`total elements: ${(data.elements || []).length}`);
  console.log(`manual elements: ${manual.length}`);
  manual.forEach((m) => console.log(`  - node/${m.id} (${m.lat}, ${m.lon}) ${m.tags.name} [${m.tags.amenity}]`));
} catch (e) {
  console.log(`=== ${layer} === ERROR: ${e.message}`);
}
