import { fetchInfrastructureData, isValidLayer } from "../services/infrastructure.service.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

/** Health check handler. */
export const health = (_request, response) => {
  response.json({ message: "Infrastructure API ready" });
};

/** Fetch raw Overpass data for a given layer. */
export const fetchLayer = async (request, response) => {
  const { layer } = request.params;
  const { studyArea: studyAreaName } = request.query;

  if (!isValidLayer(layer)) {
    return response.status(400).json({ error: `Invalid layer: ${layer}` });
  }

  const name = studyAreaName || "default";
  const studyArea = getStudyArea(name);

  if (!studyArea) {
    return response.status(400).json({ error: `Invalid study area: ${name}` });
  }

  const polygon = toOverpassPolygon(studyArea);

  try {
    const data = await fetchInfrastructureData(layer, polygon, request.signal);
    return response.json(data);
  } catch (error) {
    if (error.statusCode === 400) {
      return response.status(400).json({ error: error.message });
    }

    return response.status(502).json({ error: "Failed to reach Overpass API" });
  }
};
