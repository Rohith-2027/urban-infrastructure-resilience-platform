import { Compass } from "lucide-react";

const CompassControl = ({ onResetNorth }) => (
  <button
    type="button"
    className="gis-control-button"
    onClick={onResetNorth}
    aria-label="Reset map orientation to north"
    title="Reset north"
  >
    <Compass size={18} strokeWidth={2} />
  </button>
);

export default CompassControl;
