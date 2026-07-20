const LAYER_ID_TO_BACKEND = {
  roads: "roads",
  hospitals: "hospitals",
  "fire-stations": "fireStations",
  "police-stations": "policeStations",
  "emergency-services": "emergencyServices",
  "water-infrastructure": "waterInfrastructure",
};

export const API_BASE_URL = "";

export const getInfrastructureUrl = (layerId, studyArea = "default") =>
  `${API_BASE_URL}/api/infrastructure/${LAYER_ID_TO_BACKEND[layerId] || layerId}?studyArea=${studyArea}`;
