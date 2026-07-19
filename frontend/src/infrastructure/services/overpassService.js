const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

class OverpassRequestError extends Error {
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}

const logDevelopment = (message, endpoint) => {
  if (import.meta.env.DEV) {
    console.info(`${message}: ${endpoint}`);
  }
};

const getStudyAreaPolygon = (studyArea) => {
  const feature = studyArea?.features?.find((candidate) => candidate.geometry?.type === "Polygon");

  if (!feature) {
    throw new Error("Overpass requires a Polygon study area.");
  }

  return feature.geometry.coordinates[0]
    .map(([longitude, latitude]) => `${latitude} ${longitude}`)
    .join(" ");
};

export const buildOverpassQuery = (queryType, studyArea) => {
  const polygon = getStudyAreaPolygon(studyArea);

  const queries = {
    roads: `[out:json][timeout:30];way["highway"](poly:"${polygon}");out geom;`,
    hospitals: `[out:json][timeout:30];node["amenity"="hospital"](poly:"${polygon}");out body;`,
    fireStations: `[out:json][timeout:30];node["amenity"="fire_station"](poly:"${polygon}");out body;`,
    policeStations: `[out:json][timeout:30];node["amenity"="police"](poly:"${polygon}");out body;`,
    emergencyServices: `[out:json][timeout:30];(node["amenity"="hospital"](poly:"${polygon}");node["amenity"="fire_station"](poly:"${polygon}");node["amenity"="police"](poly:"${polygon}"));out body;`,
  };

  const query = queries[queryType];

  if (!query) {
    throw new Error(`Unsupported Overpass query type: ${queryType}`);
  }

  return query;
};

const requestFromEndpoint = async (endpoint, query, externalSignal) => {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  logDevelopment("Using Overpass endpoint", endpoint);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OverpassRequestError(
        `Overpass endpoint returned status ${response.status}.`,
        RETRIABLE_STATUS_CODES.has(response.status),
      );
    }

    const responseData = await response.json();
    logDevelopment("Overpass endpoint succeeded", endpoint);
    return responseData;
  } catch (error) {
    if (externalSignal?.aborted) {
      throw new Error("Overpass request was cancelled.", { cause: error });
    }

    if (timedOut) {
      throw new OverpassRequestError("Overpass endpoint timed out.", true);
    }

    if (error instanceof OverpassRequestError) {
      throw error;
    }

    throw new OverpassRequestError("Overpass network request failed.", true);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
};

export const requestOverpass = async (query, signal) => {
  for (const endpoint of OVERPASS_ENDPOINTS.slice(0, MAX_ATTEMPTS)) {
    try {
      return await requestFromEndpoint(endpoint, query, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      if (!error.retryable) {
        throw new Error("Overpass request was rejected by the selected server.", { cause: error });
      }
    }
  }

  throw new Error("All Overpass servers are currently unavailable.");
};
