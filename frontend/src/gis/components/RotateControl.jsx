import { RotateCw } from "lucide-react";

const RotateControl = ({ onRotate }) => (
  <button type="button" className="gis-control-button" onClick={onRotate} aria-label="Rotate map" title="Rotate map">
    <RotateCw size={18} strokeWidth={2} />
  </button>
);

export default RotateControl;
