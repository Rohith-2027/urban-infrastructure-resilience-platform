import { CAMERA_ANIMATION_OPTIONS } from "../constants/mapConstants";
import { flyToBounds } from "./mapService";

export const returnToStudyArea = (map, bounds) => flyToBounds(map, bounds);

export const focusSearchResult = (map, result) => {
  const [south, north, west, east] = result.boundingbox.map(Number);

  flyToBounds(map, [
    [west, south],
    [east, north],
  ]);
};

export const resetNorth = (map) => {
  map.easeTo({ bearing: 0, ...CAMERA_ANIMATION_OPTIONS });
};
