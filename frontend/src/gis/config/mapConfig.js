export const GIS_BASEMAP_STYLE = {
  version: 8,
  sources: {
    cartoLightNoLabels: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: "carto-light-no-labels",
      type: "raster",
      source: "cartoLightNoLabels",
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
