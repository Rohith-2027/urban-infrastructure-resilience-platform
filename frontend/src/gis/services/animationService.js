import { CAMERA_ANIMATION_OPTIONS } from "../constants/mapConstants";

export const rotateMap = (map) => {
  map.easeTo({ bearing: map.getBearing() + 45, ...CAMERA_ANIMATION_OPTIONS });
};

export const toggleMapPitch = (map) => {
  map.easeTo({ pitch: map.getPitch() > 0 ? 0 : 55, ...CAMERA_ANIMATION_OPTIONS });
};
