import { getInfrastructureUrl } from "../../config/api";

const createFeatureCollection = (features) => ({ type: "FeatureCollection", features });
const infrastructureCache = new Map();

const isPosition = (coordinates) => Array.isArray(coordinates)
  && coordinates.length >= 2
  && coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));

const hasValidCoordinates = (coordinates) => {
  if (isPosition(coordinates)) {
    return true;
  }

  return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(hasValidCoordinates);
};

export const validateInfrastructureGeoJSON = (data) => {
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    return { valid: false, errors: ["Expected a GeoJSON FeatureCollection."] };
  }

  const errors = data.features.flatMap((feature, index) => {
    if (!feature || feature.type !== "Feature") {
      return [`Feature ${index} is not a GeoJSON Feature.`];
    }

    if (!feature.geometry?.type || !hasValidCoordinates(feature.geometry.coordinates)) {
      return [`Feature ${index} does not contain valid geometry coordinates.`];
    }

    return [];
  });

  return { valid: errors.length === 0, errors };
};

export const toInfrastructureGeoJSON = (response) => {
  if (response?.type === "FeatureCollection") {
    return response;
  }

  if (Array.isArray(response)) {
    return createFeatureCollection(response);
  }

  throw new Error("Infrastructure responses must be converted to a GeoJSON FeatureCollection by their provider adapter.");
};

export const standardizeInfrastructureData = (layerId, response, queryType) => {
  const standardizationAdapter = {
    roads: overpassRoadsToGeoJSON,
    hospitals: overpassPointFeaturesToGeoJSON,
    fireStations: overpassPointFeaturesToGeoJSON,
    policeStations: overpassPointFeaturesToGeoJSON,
    powerSubstations: overpassPointFeaturesToGeoJSON,
    waterInfrastructure: overpassPointFeaturesToGeoJSON,
    education: overpassPointFeaturesToGeoJSON,
    communication: overpassPointFeaturesToGeoJSON,
    trafficManagement: overpassPointFeaturesToGeoJSON,
  };

  const adapter = standardizationAdapter[queryType];
  const data = adapter ? adapter(response, queryType) : toInfrastructureGeoJSON(response);
  const validation = validateInfrastructureGeoJSON(data);

  if (!validation.valid) {
    throw new Error(`Invalid infrastructure data for ${layerId}: ${validation.errors.join(" ")}`);
  }

  return {
    layerId,
    data,
    dataStatus: "ready",
    metadata: { featureCount: data.features.length },
  };
};

const overpassPointFeaturesToGeoJSON = (response, infrastructureType) => {
  if (response?.type === "FeatureCollection") {
    return response;
  }
  if (!Array.isArray(response?.elements)) {
    throw new Error("Overpass returned an invalid point features response.");
  }

  const getLat = (el) => el.lat ?? el.center?.lat;
  const getLon = (el) => el.lon ?? el.center?.lon;

  const points = response.elements.filter((element) => {
    const lat = getLat(element);
    const lon = getLon(element);
    return typeof lat === "number" && typeof lon === "number";
  });

  return {
    type: "FeatureCollection",
    features: points.map((point) => {
      const lat = getLat(point);
      const lon = getLon(point);
      const tags = point.tags || {};
      const meta = point.metadata || {};

      const properties = {
        ...tags,
        ...meta,
        infrastructureType: meta.infrastructureType || infrastructureType || null,
        latitude: lat,
        longitude: lon,
        source: meta.source || "overpass",
        osmId: point.id,
      };

      return {
        type: "Feature",
        id: `point/${point.id}`,
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties,
      };
    }),
  };
};

export const requestInfrastructureData = async (layerId) => ({
  layerId,
  data: null,
  dataStatus: "not-configured",
  metadata: { message: "No infrastructure provider has been configured." },
});

const overpassRoadsToGeoJSON = (response) => {
  if (response?.type === "FeatureCollection") {
    return response;
  }
  if (!Array.isArray(response?.elements)) {
    throw new Error("Overpass returned an invalid roads response.");
  }

  const roads = response.elements.filter((element) => element.type === "way" && element.tags?.highway);

  if (roads.some((road) => !Array.isArray(road.geometry) || road.geometry.length < 2)) {
    throw new Error("Overpass returned a road without valid geometry.");
  }

  const ROAD_CLASSIFICATION = {
    motorway: "National Highway", trunk: "National Highway",
    primary: "Primary Road", secondary: "Secondary Road",
    tertiary: "Tertiary Road",
    residential: "Residential Road", service: "Residential Road",
    unclassified: "Residential Road", living_street: "Residential Road",
  };

  return createFeatureCollection(roads.map((road) => {
    const tags = road.tags || {};
    const meta = road.metadata || {};
    const coords = road.geometry.map(({ lon, lat }) => [lon, lat]);

    const midIdx = Math.floor(coords.length / 2);
    const representativeLon = coords[midIdx][0];
    const representativeLat = coords[midIdx][1];

    const name = meta.name || tags.name || tags.ref || tags.alt_name || tags.loc_name || "Unnamed Road";

    return {
      type: "Feature",
      id: `way/${road.id}`,
      properties: {
        ...tags,
        ...meta,
        name,
        osmId: road.id,
        source: meta.source || "overpass",
        roadClass: ROAD_CLASSIFICATION[tags.highway] || "Other Road",
        representativeLatitude: representativeLat,
        representativeLongitude: representativeLon,
      },
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
    };
  }));
};

const getCacheKey = (layer, studyArea) => `${layer.id}:${JSON.stringify(studyArea)}`;

export const loadInfrastructureData = (layer, studyArea) => {
  if (layer.provider?.type !== "overpass") {
    return requestInfrastructureData(layer.id);
  }

  const cacheKey = getCacheKey(layer, studyArea);
  const cachedRequest = infrastructureCache.get(cacheKey);

  if (cachedRequest) {
    return cachedRequest;
  }

  const request = (async () => {
    const response = await fetch(getInfrastructureUrl(layer.id));

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Infrastructure data could not be loaded.");
    }

    const data = await response.json();
    return standardizeInfrastructureData(layer.id, data, layer.provider.queryType);
  })();

  infrastructureCache.set(cacheKey, request);
  request.catch(() => infrastructureCache.delete(cacheKey));
  return request;
};
