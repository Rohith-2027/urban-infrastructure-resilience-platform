import {
  OVERPASS_ENDPOINTS,
  MAX_ATTEMPTS,
  REQUEST_TIMEOUT_MS,
  RETRIABLE_STATUS_CODES,
  USER_AGENT,
} from "../constants/overpass.constants.js";

const QUERIES = {
  roads: (polygon) => `[out:json][timeout:30];way["highway"](poly:"${polygon}");out geom;`,
  hospitals: (polygon) => `[out:json][timeout:30];node["amenity"="hospital"](poly:"${polygon}");out body;`,
  fireStations: (polygon) => `[out:json][timeout:30];node["amenity"="fire_station"](poly:"${polygon}");out body;`,
  policeStations: (polygon) => `[out:json][timeout:30];node["amenity"="police"](poly:"${polygon}");out body;`,
  emergencyServices: (polygon) => `[out:json][timeout:30];(node["amenity"="hospital"](poly:"${polygon}");node["amenity"="fire_station"](poly:"${polygon}");node["amenity"="police"](poly:"${polygon}"));out body;`,
  "power-substations": (polygon) => `[out:json][timeout:30];node["power"="substation"](poly:"${polygon}");out body;`,
  powerTransformer: (polygon) => `[out:json][timeout:30];node["power"="transformer"](poly:"${polygon}");out body;`,
  powerLine: (polygon) => `[out:json][timeout:30];way["power"="line"](poly:"${polygon}");out body;`,
  powerMinorLine: (polygon) => `[out:json][timeout:30];way["power"="minor_line"](poly:"${polygon}");out body;`,
  powerTower: (polygon) => `[out:json][timeout:30];node["power"="tower"](poly:"${polygon}");out body;`,
  powerPole: (polygon) => `[out:json][timeout:30];node["power"="pole"](poly:"${polygon}");out body;`,
  waterInfrastructure: (polygon) => `[out:json][timeout:30];(node["amenity"="water_treatment_plant"](poly:"${polygon}");way["natural"="water"](poly:"${polygon}");node["amenity"="water_tank"](poly:"${polygon}"));out body;`,
};

/** Build Overpass QL query for a given layer type. */
export const buildQuery = (layer, polygon) => {
  const factory = QUERIES[layer];

  if (!factory) {
    throw new Error(`Unsupported layer: ${layer}`);
  }

  return factory(polygon);
};

const requestFromEndpoint = async (endpoint, query, signal) => {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Overpass returned status ${response.status}`);
      error.retryable = RETRIABLE_STATUS_CODES.has(response.status);
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (signal?.aborted) {
      throw Object.assign(new Error("Overpass request was cancelled"), { cause: error });
    }

    if (timedOut) {
      throw Object.assign(new Error("Overpass request timed out"), { retryable: true });
    }

    if (error.retryable !== undefined) {
      throw error;
    }

    throw Object.assign(new Error("Overpass network request failed"), { retryable: true });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
};

/** Execute an Overpass query with failover across all configured endpoints. */
export const requestOverpass = async (query, signal) => {
  for (const endpoint of OVERPASS_ENDPOINTS.slice(0, MAX_ATTEMPTS)) {
    try {
      return await requestFromEndpoint(endpoint, query, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }
  }

  console.error("[Overpass] All configured endpoints failed");
  throw new Error("All Overpass servers are currently unavailable");
};
