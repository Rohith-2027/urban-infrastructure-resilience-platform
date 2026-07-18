export const OPEN_STREET_MAP_STYLE = {
  version: 8,
  sources: {
    openstreetmap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "openstreetmap",
      type: "raster",
      source: "openstreetmap",
    },
  ],
};

export const MAP_INITIAL_VIEW_STATE = {
  longitude: 77.1185,
  latitude: 13.3295,
  zoom: 15,
  bearing: 0,
  pitch: 0,
};

export const MAP_INTERACTION_OPTIONS = {
  dragPan: true,
  scrollZoom: true,
  touchZoomRotate: true,
  keyboard: true,
  doubleClickZoom: true,
};
