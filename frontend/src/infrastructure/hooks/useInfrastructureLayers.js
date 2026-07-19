import { useEffect, useState } from "react";
import { createLayerDataState, LAYER_REGISTRY, getLayerRegistry } from "../../gis/config/layerRegistry";
import { loadInfrastructureData } from "../services/infrastructureService";

const getConfiguredLayers = () => LAYER_REGISTRY.filter((layer) => layer.provider);

export const useInfrastructureLayers = (studyArea) => {
  const [layerData, setLayerData] = useState(createLayerDataState);

  useEffect(() => {
    if (!studyArea) {
      return undefined;
    }

    let isCurrent = true;

    const loadLayers = async () => {
      await Promise.all(getConfiguredLayers().map(async (layer) => {
        setLayerData((current) => ({
          ...current,
          [layer.id]: { ...current[layer.id], dataStatus: "loading", error: null },
        }));

        try {
          const result = await loadInfrastructureData(layer, studyArea);

          if (isCurrent) {
            setLayerData((current) => ({
              ...current,
              [layer.id]: { ...result, error: null },
            }));
          }
        } catch (error) {
          if (isCurrent) {
            setLayerData((current) => ({
              ...current,
              [layer.id]: {
                ...current[layer.id],
                dataStatus: "error",
                error: error instanceof Error ? error.message : "Infrastructure data could not be loaded.",
              },
            }));
          }
        }
      }));
    };

    loadLayers();

    return () => {
      isCurrent = false;
    };
  }, [studyArea]);

  return { layerData, layerRegistry: getLayerRegistry(layerData) };
};
