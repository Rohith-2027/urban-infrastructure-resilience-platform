const studyAreas = {
  default: {
    type: "Polygon",
    coordinates: [
      [
        [77.097095, 13.3329],
        [77.118135, 13.325913],
        [77.12981, 13.3202],
        [77.133769, 13.312004],
        [77.139857, 13.30965],
        [77.147468, 13.313145],
        [77.146949, 13.318241],
        [77.124992, 13.344825],
        [77.115494, 13.344645],
        [77.112026, 13.346659],
        [77.10445, 13.349673],
        [77.092939, 13.345483],
        [77.097095, 13.3329],
      ],
    ],
  },
};

/** Retrieve a study area by name, or null if not found. */
export const getStudyArea = (name) => studyAreas[name] ?? null;

/** Convert a study area polygon to the space-separated string Overpass expects. */
export const toOverpassPolygon = (polygon) =>
  polygon.coordinates[0]
    .map(([lon, lat]) => `${lat} ${lon}`)
    .join(" ");
