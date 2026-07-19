import { buildQuery, requestOverpass } from "./overpass.service.js";

const SUPPORTED_LAYERS = [
  "roads",
  "hospitals",
  "fireStations",
  "policeStations",
  "emergencyServices",
];

/** Check whether a layer name is supported. */
export const isValidLayer = (layer) => SUPPORTED_LAYERS.includes(layer);

/** Fetch raw Overpass data for a validated layer and study area polygon. */
export const fetchInfrastructureData = async (layer, polygon, signal) => {
  if (!isValidLayer(layer)) {
    throw Object.assign(new Error(`Invalid layer: ${layer}`), { statusCode: 400 });
  }

  const query = buildQuery(layer, polygon);

  return requestOverpass(query, signal);
};
