import { resetNorth } from "../services/cameraService";
import { rotateMap, toggleMapPitch } from "../services/animationService";

export const useRotation = (map) => ({
  resetNorth: () => resetNorth(map),
  rotate: () => rotateMap(map),
  togglePitch: () => toggleMapPitch(map),
});
