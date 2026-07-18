import { useState } from "react";
import { setLayerVisibility } from "../services/layerService";

const INITIAL_LAYERS = { studyArea: true };

export const useLayers = () => {
  const [layers, setLayers] = useState(INITIAL_LAYERS);

  const toggleLayer = (layerId) => {
    setLayers((currentLayers) =>
      setLayerVisibility(currentLayers, layerId, !currentLayers[layerId]),
    );
  };

  return { layers, toggleLayer };
};
