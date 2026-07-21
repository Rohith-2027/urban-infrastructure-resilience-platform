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
  {
    id: "roads",
    displayName: "Roads",
    category: "Transportation",
    defaultVisible: true,
    source: { id: "roads-source", type: "geojson", data: null },
    layers: [
      {
        id: "roads-layer",
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "match", ["get", "highway"],
            "motorway", "#dc2626",
            "trunk", "#dc2626",
            "primary", "#f97316",
            "secondary", "#f97316",
            "tertiary", "#eab308",
            "residential", "#94a3b8",
            "service", "#94a3b8",
            "unclassified", "#94a3b8",
            "living_street", "#94a3b8",
            "#94a3b8",
          ],
          "line-width": [
            "match", ["get", "highway"],
            "motorway", 3.5,
            "trunk", 3,
            "primary", 2.5,
            "secondary", 2,
            "tertiary", 1.5,
            1,
          ],
        },
      },
    ],
    drawOrder: 10,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "roads" },
    metadata: { infrastructureType: "roads" },
  },
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
    id: "fireStations",
    displayName: "Fire stations",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "fireStations-source", type: "geojson", data: null },
    layers: [
      { id: "fireStations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "fireStations-marker", type: "circle", paint: { "circle-color": "#ea580c", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 30,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "fireStations" },
    metadata: { infrastructureType: "fireStations" },
  },
  {
    id: "policeStations",
    displayName: "Police stations",
    category: "Emergency services",
    defaultVisible: true,
    source: { id: "policeStations-source", type: "geojson", data: null },
    layers: [
      { id: "policeStations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "policeStations-marker", type: "circle", paint: { "circle-color": "#2563eb", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 40,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "policeStations" },
    metadata: { infrastructureType: "policeStations" },
  },
  {
    id: "powerSubstations",
    displayName: "Power substations",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "powerSubstations-source", type: "geojson", data: null },
    layers: [
      { id: "powerSubstations-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "powerSubstations-marker", type: "circle", paint: { "circle-color": "#f59e0b", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 50,
    dataStatus: "not-configured",
    simulationEnabled: false,
    provider: {
      type: "overpass",
      queryType: "powerSubstations"
    },
    metadata: { infrastructureType: "powerSubstations" },
  },

  {
    id: "waterInfrastructure",
    displayName: "Water Infrastructure",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "waterInfrastructure-source", type: "geojson", data: null },
    layers: [
      { id: "waterInfrastructure-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "waterInfrastructure-marker", type: "circle", paint: { "circle-color": "#06b6d4", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 60,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "waterInfrastructure" },
    metadata: { infrastructureType: "waterInfrastructure" },
  },
  {
    id: "education",
    displayName: "Education",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "education-source", type: "geojson", data: null },
    layers: [
      { id: "education-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "education-marker", type: "circle", paint: { "circle-color": "#22c55e", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 65,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "education" },
    metadata: { infrastructureType: "education" },
  },
  {
    id: "communication",
    displayName: "Communication infrastructure",
    category: "Utilities",
    defaultVisible: true,
    source: { id: "communication-source", type: "geojson", data: null },
    layers: [
      { id: "communication-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "communication-marker", type: "circle", paint: { "circle-color": "#7c3aed", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 70,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "communication" },
    metadata: { infrastructureType: "communication" },
  },
  {
    id: "trafficManagement",
    displayName: "Traffic Management",
    category: "Transportation",
    defaultVisible: false,
    source: { id: "trafficManagement-source", type: "geojson", data: null },
    layers: [
      { id: "trafficManagement-halo", type: "circle", paint: { "circle-color": "#ffffff", "circle-radius": 8, "circle-opacity": 0.95 } },
      { id: "trafficManagement-marker", type: "circle", paint: { "circle-color": "#f97316", "circle-radius": 5, "circle-opacity": 0.9 } },
    ],
    drawOrder: 75,
    dataStatus: "not-configured",
    provider: { type: "overpass", queryType: "trafficManagement" },
    metadata: { infrastructureType: "trafficManagement" },
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
