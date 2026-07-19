const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const MAX_ATTEMPTS = OVERPASS_ENDPOINTS.length;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const QUERIES = {
  roads: (polygon) => `[out:json][timeout:30];way["highway"](poly:"${polygon}");out geom;`,
  hospitals: (polygon) => `[out:json][timeout:30];node["amenity"="hospital"](poly:"${polygon}");out body;`,
  fireStations: (polygon) => `[out:json][timeout:30];node["amenity"="fire_station"](poly:"${polygon}");out body;`,
  policeStations: (polygon) => `[out:json][timeout:30];node["amenity"="police"](poly:"${polygon}");out body;`,
  emergencyServices: (polygon) => `[out:json][timeout:30];(node["amenity"="hospital"](poly:"${polygon}");node["amenity"="fire_station"](poly:"${polygon}");node["amenity"="police"](poly:"${polygon}"));out body;`,
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
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
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

/** Execute an Overpass query with retry across available endpoints. */
export const requestOverpass = async (query, signal) => {
  for (const endpoint of OVERPASS_ENDPOINTS.slice(0, MAX_ATTEMPTS)) {
    try {
      return await requestFromEndpoint(endpoint, query, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      if (!error.retryable) {
        throw new Error("Overpass request was rejected by the selected server", { cause: error });
      }
    }
  }

  throw new Error("All Overpass servers are currently unavailable");
};
