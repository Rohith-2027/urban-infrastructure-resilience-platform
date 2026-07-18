import { returnToStudyArea } from "../services/cameraService";
import { zoomBy } from "../services/mapService";

export const useCamera = (map, studyAreaBounds) => ({
  zoomIn: () => zoomBy(map, 1),
  zoomOut: () => zoomBy(map, -1),
  goHome: () => returnToStudyArea(map, studyAreaBounds),
});
