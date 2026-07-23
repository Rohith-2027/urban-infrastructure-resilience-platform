import { Router } from "express";
import DependencyService from "../dependency/dependencyService.js";
import { fetchInfrastructureData } from "../services/infrastructure.service.js";
import { getStudyArea, toOverpassPolygon } from "../utils/studyAreas.js";

const router = Router();

const LAYERS = [
  "hospitals",
  "fireStations",
  "policeStations",
  "powerSubstations",
  "waterInfrastructure",
  "education",
  "communication",
  "trafficManagement",
];

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedService = null;
let cacheTimestamp = 0;

const buildGraphFromLayers = async () => {
  if (cachedService && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedService;
  }

  const studyArea = getStudyArea("default");
  const polygon = toOverpassPolygon(studyArea);
  const infrastructure = {};

  const results = await Promise.allSettled(
    LAYERS.map((layer) => fetchInfrastructureData(layer, polygon))
  );

  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];
    const result = results[i];

    if (result.status === "fulfilled" && Array.isArray(result.value?.elements)) {
      infrastructure[layer] = result.value.elements;
    }
  }

  const dependencyService = new DependencyService();
  dependencyService.buildGraph(infrastructure);

  cachedService = dependencyService;
  cacheTimestamp = Date.now();

  return dependencyService;
};

router.get("/graph", async (req, res) => {
  try {
    const dependencyService = await buildGraphFromLayers();
    const nodes = dependencyService.getGraph().nodes;
    const edges = dependencyService.getEdges();
    const graphSummary = dependencyService.getGraphSummary();
    res.json({ success: true, data: { nodes, edges, graphSummary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/edges", async (req, res) => {
  try {
    const dependencyService = await buildGraphFromLayers();
    const data = dependencyService.getEdges();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/health", async (req, res) => {
  try {
    const dependencyService = await buildGraphFromLayers();
    const graphSummary = dependencyService.getGraphSummary();
    res.json({ success: true, data: graphSummary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
