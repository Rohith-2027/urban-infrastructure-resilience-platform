import { useEffect } from "react";
import { ScaleControl as MapLibreScaleControl } from "maplibre-gl";

const ScaleControl = ({ map }) => {
  useEffect(() => {
    const scaleControl = new MapLibreScaleControl({ maxWidth: 120, unit: "metric" });
    map.addControl(scaleControl, "bottom-left");

    return () => map.removeControl(scaleControl);
  }, [map]);

  return null;
};

export default ScaleControl;
