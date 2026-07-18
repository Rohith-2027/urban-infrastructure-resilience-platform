const extendBounds = (bounds, coordinate) => {
  const [longitude, latitude] = coordinate;

  bounds[0] = Math.min(bounds[0], longitude);
  bounds[1] = Math.min(bounds[1], latitude);
  bounds[2] = Math.max(bounds[2], longitude);
  bounds[3] = Math.max(bounds[3], latitude);
};

const visitCoordinates = (coordinates, bounds) => {
  if (typeof coordinates[0] === "number") {
    extendBounds(bounds, coordinates);
    return;
  }

  coordinates.forEach((coordinate) => visitCoordinates(coordinate, bounds));
};

export const getFeatureCollectionBounds = (featureCollection) => {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];

  featureCollection.features.forEach((feature) => {
    if (feature.geometry) {
      visitCoordinates(feature.geometry.coordinates, bounds);
    }
  });

  if (!Number.isFinite(bounds[0])) {
    throw new Error("The study area does not contain valid coordinates.");
  }

  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
};
