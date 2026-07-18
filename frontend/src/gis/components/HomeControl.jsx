import { House } from "lucide-react";

const HomeControl = ({ onGoHome }) => (
  <button type="button" className="gis-control-button" onClick={onGoHome} aria-label="Return to study area" title="Study area">
    <House size={18} strokeWidth={2} />
  </button>
);

export default HomeControl;
