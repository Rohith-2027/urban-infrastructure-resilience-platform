export const DEPENDENCY_SOURCE_ID = "dependency-source";
export const DEPENDENCY_LAYER_ID = "dependency-layer";
export const DEPENDENCY_LAYER_SELECTED_ID = "dependency-layer-selected";

export const DEPENDENCY_TYPE_COLORS = {
  POWER_LINE: "#f59e0b",
  FIBER_OPTIC: "#8b5cf6",
  ROAD_ACCESS: "#22c55e",
  WATER_PIPELINE: "#3b82f6",
  EMERGENCY_ROUTE: "#ef4444",
  MEDICAL_SERVICE: "#ec4899",
};

export const DEPENDENCY_TYPE_LABEL = {
  POWER_LINE: "Power Line",
  FIBER_OPTIC: "Fiber Optic",
  ROAD_ACCESS: "Road Access",
  WATER_PIPELINE: "Water Pipeline",
  EMERGENCY_ROUTE: "Emergency Route",
  MEDICAL_SERVICE: "Medical Service",
};

export const DEFAULT_DEPENDENCY_COLOR = "#3b82f6";

const createFeatureProperties = (edge) => ({
  id: edge.id,
  type: edge.type,
  status: edge.status || "active",
  weight: edge.weight ?? 1,
  providerRank: edge.providerRank || null,
  providerLimit: edge.providerLimit || null,
  sourceId: edge.source?.id || null,
  sourceName: edge.source?.name || null,
  sourceLayer: edge.source?.layer || edge.sourceLayer || null,
  sourceType: edge.source?.type || null,
  targetId: edge.target?.id || null,
  targetName: edge.target?.name || null,
  targetLayer: edge.target?.layer || edge.targetLayer || null,
  targetType: edge.target?.type || null,
});

export const createDependencySource = (edges = []) => ({
  type: "FeatureCollection",
  features: edges
    .filter((edge) => edge.source && edge.target)
    .map((edge) => ({
      type: "Feature",
      properties: createFeatureProperties(edge),
      geometry: {
        type: "LineString",
        coordinates: [
          [edge.source.longitude, edge.source.latitude],
          [edge.target.longitude, edge.target.latitude],
        ],
      },
    })),
});

export const createDependencyLayer = (selectedEdgeId = null) => {
  const colorStops = ["match", ["get", "type"]];

  for (const [type, color] of Object.entries(DEPENDENCY_TYPE_COLORS)) {
    colorStops.push(type, color);
  }
  colorStops.push(DEFAULT_DEPENDENCY_COLOR);

  const sharedLayout = {
    "line-cap": "round",
    "line-join": "round",
  };

  const normal = {
    id: DEPENDENCY_LAYER_ID,
    type: "line",
    source: DEPENDENCY_SOURCE_ID,
    layout: sharedLayout,
    paint: {
      "line-color": colorStops,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 15, 3, 18, 5],
      "line-opacity": 0.8,
      "line-dasharray": [2, 2],
    },
  };

  const selected = {
    id: DEPENDENCY_LAYER_SELECTED_ID,
    type: "line",
    source: DEPENDENCY_SOURCE_ID,
    filter: ["==", ["id"], selectedEdgeId || ""],
    layout: sharedLayout,
    paint: {
      "line-color": colorStops,
      "line-width": 5,
      "line-opacity": 1,
    },
  };

  return { normal, selected };
};
