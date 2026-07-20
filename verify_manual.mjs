import { fetchInfrastructureData } from "./backend/src/services/infrastructure.service.js";
import { toOverpassPolygon } from "./backend/src/utils/studyAreas.js";
import { getStudyArea } from "./backend/src/utils/studyAreas.js";

const area = getStudyArea("default");
const polygon = toOverpassPolygon(area);

for (const layer of ["policeStations", "fireStations", "emergencyServices", "roads", "hospitals"]) {
  try {
    const data = await fetchInfrastructureData(layer, polygon);
    const manual = (data.elements || []).filter((e) => e.tags && e.tags.source === "manual");
    console.log(`\n=== ${layer} ===`);
    console.log(`total elements: ${(data.elements || []).length}`);
    console.log(`manual elements: ${manual.length}`);
    manual.forEach((m) => {
      console.log(`  - node/${m.id} (${m.lat}, ${m.lon}) tags=${JSON.stringify(m.tags)}`);
    });
  } catch (e) {
    console.log(`\n=== ${layer} === ERROR: ${e.message}`);
  }
}
