import { useEffect, useRef } from "react";
import studyArea from "../../data/study-area.json";
import { getFeatureCollectionBounds } from "../utils/geojson";
import { flyToBounds } from "../services/mapService";

const studyAreaBounds = getFeatureCollectionBounds(studyArea);

export const useStudyArea = (map) => {
  const hasFittedBounds = useRef(false);

  useEffect(() => {
    if (!map || hasFittedBounds.current) {
      return;
    }

    flyToBounds(map, studyAreaBounds);
    hasFittedBounds.current = true;
  }, [map]);

  return { data: studyArea, bounds: studyAreaBounds };
};
