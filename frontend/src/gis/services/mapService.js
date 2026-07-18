import { CAMERA_ANIMATION_OPTIONS } from "../constants/mapConstants";

export const flyToBounds = (map, bounds) => {
  map.fitBounds(bounds, {
    padding: 72,
    maxZoom: 15,
    duration: CAMERA_ANIMATION_OPTIONS.duration,
    essential: CAMERA_ANIMATION_OPTIONS.essential,
  });
};

export const zoomBy = (map, delta) => {
  map.zoomTo(map.getZoom() + delta, CAMERA_ANIMATION_OPTIONS);
};
