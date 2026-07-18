import { Minus, Plus } from "lucide-react";

const ZoomControl = ({ onZoomIn, onZoomOut }) => (
  <div className="gis-control-group" aria-label="Map zoom controls">
    <button type="button" className="gis-control-button" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
      <Plus size={18} strokeWidth={2.5} />
    </button>
    <button type="button" className="gis-control-button" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
      <Minus size={18} strokeWidth={2.5} />
    </button>
  </div>
);

export default ZoomControl;
