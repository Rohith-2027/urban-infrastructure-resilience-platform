const LAYER_ID_TO_BACKEND = {
  roads: "roads",
  hospitals: "hospitals",
  fireStations: "fireStations",
  policeStations: "policeStations",
  waterInfrastructure: "waterInfrastructure",
  education: "education",
  powerSubstations: "powerSubstations",
  communication: "communication",
  trafficManagement: "trafficManagement",
};

export const API_BASE_URL = "";

export const getInfrastructureUrl = (layerId, studyArea = "default") =>
  `${API_BASE_URL}/api/infrastructure/${LAYER_ID_TO_BACKEND[layerId] || layerId}?studyArea=${studyArea}`;
