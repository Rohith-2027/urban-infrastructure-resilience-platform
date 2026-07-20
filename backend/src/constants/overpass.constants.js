export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export const MAX_ATTEMPTS = OVERPASS_ENDPOINTS.length;
export const REQUEST_TIMEOUT_MS = 30_000;
export const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
export const USER_AGENT = "Urban-Infrastructure-Resilience-Platform/1.0 (Educational Project)";
