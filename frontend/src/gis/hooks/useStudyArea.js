import { useEffect, useRef } from "react";
import { getLayerById, STUDY_AREA_LAYER_ID } from "../config/layerRegistry";
import { getFeatureCollectionBounds } from "../utils/geojson";
import { flyToBounds } from "../services/mapService";

const studyArea = getLayerById(STUDY_AREA_LAYER_ID).source.data;
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
