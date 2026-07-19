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
    drawOrder: 10,
    provider: { type: "overpass", queryType: "roads" },
    style: { type: "line", paint: { "line-color": "#64748b", "line-width": 2 } },
  }),
  {
    id: "hospitals",
    displayName: "Hospitals",
    category: "Emergency services",
    defaultVisible: false,
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
    defaultVisible: false,
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
    defaultVisible: false,
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
  createPlaceholderLayer({
    id: "power",
    displayName: "Power infrastructure",
    category: "Utilities",
    drawOrder: 50,
    style: { type: "line", paint: { "line-color": "#eab308", "line-width": 2 } },
  }),
  createPlaceholderLayer({
    id: "water",
    displayName: "Water infrastructure",
    category: "Utilities",
    drawOrder: 60,
    style: { type: "line", paint: { "line-color": "#06b6d4", "line-width": 2 } },
  }),
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
    defaultVisible: false,
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
