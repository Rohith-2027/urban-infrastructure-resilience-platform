import { buildOverpassQuery, requestOverpass } from "./overpassService";

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
    emergencyServices: overpassPointFeaturesToGeoJSON,
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
  if (!Array.isArray(response?.elements)) {
    throw new Error("Overpass returned an invalid point features response.");
  }

  const points = response.elements.filter((element) => element.type === "node");

  if (points.some((point) => typeof point.lat !== "number" || typeof point.lon !== "number")) {
    throw new Error("Overpass returned a point without valid coordinates.");
  }

  return {
    type: "FeatureCollection",
    features: points.map((point) => {
      const tags = point.tags || {};
      const capacity = tags.beds || tags.capacity || null;
      const subcategory = tags.emergency === "yes" ? "emergency" : tags.healthcare || null;
      const metadata = {
        id: `node/${point.id}`,
        osmId: point.id,
        name: tags.name || null,
        infrastructureType: infrastructureType || null,
        subcategory,
        operator: tags.operator || tags['operator:name'] || null,
        ownership: tags.ownership || null,
        status: tags.status || null,
        capacity: capacity ? Number(capacity) : null,
        criticality: tags.criticality || null,
        serviceArea: null,
        connectedRoadIds: [],
        dependencyIds: [],
        latitude: point.lat,
        longitude: point.lon,
        tags,
        source: "overpass",
        lastUpdated: null,
      };

      return {
        type: "Feature",
        id: metadata.id,
        geometry: {
          type: "Point",
          coordinates: [point.lon, point.lat],
        },
        properties: {
          ...tags,
          ...metadata,
        },
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
  if (!Array.isArray(response?.elements)) {
    throw new Error("Overpass returned an invalid roads response.");
  }

  const roads = response.elements.filter((element) => element.type === "way" && element.tags?.highway);

  if (roads.some((road) => !Array.isArray(road.geometry) || road.geometry.length < 2)) {
    throw new Error("Overpass returned a road without valid geometry.");
  }

  return createFeatureCollection(roads.map((road) => ({
    type: "Feature",
    id: `way/${road.id}`,
    properties: { ...road.tags, osmId: road.id },
    geometry: {
      type: "LineString",
      coordinates: road.geometry.map(({ lon, lat }) => [lon, lat]),
    },
  })));
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
    const query = buildOverpassQuery(layer.provider.queryType, studyArea);
    const response = await requestOverpass(query);
    return standardizeInfrastructureData(layer.id, response, layer.provider.queryType);
  })();

  infrastructureCache.set(cacheKey, request);
  request.catch(() => infrastructureCache.delete(cacheKey));
  return request;
};
