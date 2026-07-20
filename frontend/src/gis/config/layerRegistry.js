import studyArea from "../../data/study-area.json";

export const STUDY_AREA_LAYER_ID = "study-area";

const createPlaceholderLayer = ({ id, displayName, category, drawOrder, provider, style }) => ({
  id,
  displayName,
  category,
  defaultVisible: false,
  source: { id: `${id}-source`, type: "geojson", data: null },
  layers: [{ id: `${id}-layer`, ...style }],
  drawOrder,
  dataStatus: "not-configured",
  provider,
  metadata: { infrastructureType: id },
});

export const LAYER_REGISTRY = [
  {
    id: STUDY_AREA_LAYER_ID,
    displayName: "Study area",
    category: "Reference",
    defaultVisible: true,
    source: { id: "study-area", type: "geojson", data: studyArea },
    layers: [
      {
        id: "study-area-fill",
        type: "fill",
        paint: { "fill-color": "#2563eb", "fill-opacity": 0.16 },
      },
      {
        id: "study-area-outline",
        type: "line",
        paint: { "line-color": "#2563eb", "line-width": 3, "line-opacity": 0.95 },
      },
    ],
    drawOrder: 0,
    dataStatus: "ready",
    metadata: { infrastructureType: "study-area" },
  },
  createPlaceholderLayer({
    id: "roads",
    displayName: "Roads",
    category: "Transportation",
    defaultVisible: true,
    drawOrder: 10,
    provider: { type: "overpass", queryType: "roads" },
    style: { type: "line", paint: { "line-color": "#64748b", "line-width": 2 } },
  }),
  {
    id: "hospitals",
    displayName: "Hospitals",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "hospitals-source", type: "geojson", data: null },
    layers: [
      { id: "hospitals-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "hospitals-marker", type: "circle", paint: { "circle-color": "#dc2626", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 20,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "hospitals" },
    metadata: { infrastructureType: "hospitals" },
  },
  {
    id: "fire-stations",
    displayName: "Fire stations",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "fire-stations-source", type: "geojson", data: null },
    layers: [
      { id: "fire-stations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "fire-stations-marker", type: "circle", paint: { "circle-color": "#ea580c", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 30,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "fireStations" },
    metadata: { infrastructureType: "fire-stations" },
  },
  {
    id: "police-stations",
    displayName: "Police stations",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "police-stations-source", type: "geojson", data: null },
    layers: [
      { id: "police-stations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "police-stations-marker", type: "circle", paint: { "circle-color": "#2563eb", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 40,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "policeStations" },
    metadata: { infrastructureType: "police-stations" },
  },
  {
    id: "power-substations",
    displayName: "Power substations",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "power-substations-source", type: "geojson", data: null },
    layers: [
      { id: "power-substations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "power-substations-marker", type: "circle", paint: { "circle-color": "#f59e0b", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 50,
    dataStatus: "not-configured",
    simulationEnabled: false,
    provider: {
      type: "overpass",
      queryType: "power-substations"
    },
    metadata: { infrastructureType: "power-substations" },
  },
  {
    id: "powerTransformer",
    displayName: "Power transformers",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerTransformer-source", type: "geojson", data: null },
    layers: [
      { id: "powerTransformer-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "powerTransformer-marker", type: "circle", paint: { "circle-color": "#f59e0b", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 51,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "powerTransformer" },
    metadata: { infrastructureType: "powerTransformer" },
  },
  {
    id: "powerLine",
    displayName: "Power lines",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerLine-source", type: "geojson", data: null },
    layers: [
      { id: "powerLine-layer", type: "line", paint: { "line-color": "#64748b", "line-width": 2 } },
    ],
    drawOrder: 52,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "powerLine" },
    metadata: { infrastructureType: "powerLine" },
  },
  {
    id: "powerMinorLine",
    displayName: "Power minor lines",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerMinorLine-source", type: "geojson", data: null },
    layers: [
      { id: "powerMinorLine-layer", type: "line", paint: { "line-color": "#94a3b8", "line-width": 1.5 } },
    ],
    drawOrder: 53,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "powerMinorLine" },
    metadata: { infrastructureType: "powerMinorLine" },
  },
  {
    id: "powerTower",
    displayName: "Power towers",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerTower-source", type: "geojson", data: null },
    layers: [
      { id: "powerTower-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "powerTower-marker", type: "circle", paint: { "circle-color": "#94a3b8", "circle-radius": 4, "circle-opacity": 0.9 } },
    ],
    drawOrder: 54,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "powerTower" },
    metadata: { infrastructureType: "powerTower" },
  },
  {
    id: "powerPole",
    displayName: "Power poles",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerPole-source", type: "geojson", data: null },
    layers: [
      { id: "powerPole-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "powerPole-marker", type: "circle", paint: { "circle-color": "#94a3b8", "circle-radius": 4, "circle-opacity": 0.9 } },
    ],
    drawOrder: 55,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "powerPole" },
    metadata: { infrastructureType: "powerPole" },
  },
  {
    id: "powerSubstationsCombined",
    displayName: "All power infrastructure",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerSubstationsCombined-source", type: "geojson", data: null },
    layers: [
      { id: "powerSubstationsCombined-layer", type: "circle", paint: { "circle-color": "#fbbf24", "circle-radius": 6, "circle-opacity": 0.9 } },
    ],
    drawOrder: 56,
    dataStatus: "not-configured",
    simulationEnabled: false,
    provider: { type: "overpass", queryType: "powerSubstationsCombined" },
    metadata: { infrastructureType: "powerSubstationsCombined" },
  },
  {
    id: "water-infrastructure",
    displayName: "Water Infrastructure",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "water-infrastructure-source", type: "geojson", data: null },
    layers: [
      { id: "water-infrastructure-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "water-infrastructure-marker", type: "circle", paint: { "circle-color": "#06b6d4", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 60,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "waterInfrastructure" },
    metadata: { infrastructureType: "water-infrastructure" },
  },
  createPlaceholderLayer({
    id: "communication",
    displayName: "Communication infrastructure",
    category: "Utilities",
    drawOrder: 70,
    style: { type: "circle", paint: { "circle-color": "#7c3aed", "circle-radius": 4 } },
  }),
  {
    id: "emergency-services",
    displayName: "Emergency services",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "emergency-services-source", type: "geojson", data: null },
    layers: [
      { id: "emergency-services-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "emergency-services-marker", type: "circle", paint: { "circle-color": "#9333ea", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 80,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "emergencyServices" },
    metadata: { infrastructureType: "emergency-services" },
  },
].sort((firstLayer, secondLayer) => firstLayer.drawOrder - secondLayer.drawOrder);

export const getLayerById = (layerId) => LAYER_REGISTRY.find((layer) => layer.id === layerId);

export const createLayerDataState = () => Object.fromEntries(LAYER_REGISTRY.map((layer) => [layer.id, {
  data: layer.source.data,
  dataStatus: layer.dataStatus,
  error: null,
}]));

export const getLayerRegistry = (layerData = {}) => LAYER_REGISTRY.map((layer) => {
  const runtimeLayer = layerData[layer.id];

  return {
    ...layer,
    source: { ...layer.source, data: runtimeLayer?.data ?? layer.source.data },
    dataStatus: runtimeLayer?.dataStatus ?? layer.dataStatus,
    error: runtimeLayer?.error ?? null,
  };
});

export const getRenderableLayers = (layerData) => getLayerRegistry(layerData)
  .filter((layer) => layer.dataStatus === "ready" && layer.source.data);
