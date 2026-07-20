import { fetchInfrastructureData } from "./backend/src/services/infrastructure.service.js";
import { toOverpassPolygon, getStudyArea } from "./backend/src/utils/studyAreas.js";

const area = getStudyArea("default");
const polygon = toOverpassPolygon(area);

(async () => {
  const layers = ["policeStations", "fireStations", "emergencyServices", "power-substations", "roads", "hospitals"];
  for (const layer of layers) {
    try {
      const data = await fetchInfrastructureData(layer, polygon);
      const elements = data.elements || [];
      const manual = elements.filter((e) => e.tags?.source === 'manual').length;
      const enriched = elements.filter((e) => e.metadata).length;
      console.log(`\n=== ${layer} ===`);
      console.log(`  Total elements: ${elements.length}`);
      console.log(`  Enriched with metadata: ${enriched}`);
      console.log(`  Manual features: ${manual}`);
      if (enriched > 0) {
        const sample = elements.find((e) => e.metadata);
        if (sample) {
          console.log(`  Sample metadata: layer=${sample.metadata.layer}, sector=${sample.metadata.sector}, criticality=${sample.metadata.criticality}, dependsOn=${sample.metadata.dependsOn.join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`\n=== ${layer} === ERROR: ${e.message}`);
    }
  }
})();