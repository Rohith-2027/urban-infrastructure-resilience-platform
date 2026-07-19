import { useState } from "react";
import { LAYER_REGISTRY } from "../config/layerRegistry";
import { setLayerVisibility } from "../services/layerService";

const INITIAL_LAYERS = Object.fromEntries(
  LAYER_REGISTRY.map((layer) => [layer.id, layer.defaultVisible]),
);

export const useLayers = () => {
  const [layers, setLayers] = useState(INITIAL_LAYERS);

  const toggleLayer = (layerId) => {
    if (!Object.hasOwn(INITIAL_LAYERS, layerId)) {
      return;
    }

    setLayers((currentLayers) =>
      setLayerVisibility(currentLayers, layerId, !currentLayers[layerId]),
    );
  };

  return { layers, toggleLayer };
};
