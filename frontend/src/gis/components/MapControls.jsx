import { useCamera } from "../hooks/useCamera";
import { useMap } from "../hooks/useMap";
import { useRotation } from "../hooks/useRotation";
import CompassControl from "./CompassControl";
import HomeControl from "./HomeControl";
import LayerControl from "./LayerControl";
import RotateControl from "./RotateControl";
import ZoomControl from "./ZoomControl";
import { Axis3d } from "lucide-react";

const MapControls = ({ studyAreaBounds, layers, onToggleLayer }) => {
  const map = useMap();
  const { zoomIn, zoomOut, goHome } = useCamera(map, studyAreaBounds);
  const { resetNorth, rotate, togglePitch } = useRotation(map);

  return (
    <aside className="gis-map-controls" aria-label="Map controls">
      <CompassControl onResetNorth={resetNorth} />
      <ZoomControl onZoomIn={zoomIn} onZoomOut={zoomOut} />
      <HomeControl onGoHome={goHome} />
      <RotateControl onRotate={rotate} />
      <button type="button" className="gis-control-button" onClick={togglePitch} aria-label="Toggle map pitch" title="Toggle pitch">
        <Axis3d size={18} strokeWidth={2} />
      </button>
      <LayerControl layers={layers} onToggleLayer={onToggleLayer} />
    </aside>
  );
};

export default MapControls;
