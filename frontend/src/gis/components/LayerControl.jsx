import { Layers } from "lucide-react";
import { useState } from "react";

const LayerControl = ({ layers, onToggleLayer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="gis-layer-control">
      <button
        type="button"
        className="gis-control-button"
        onClick={() => setIsOpen((isVisible) => !isVisible)}
        aria-label="Open layer manager"
        aria-expanded={isOpen}
        title="Layers"
      >
        <Layers size={18} strokeWidth={2} />
      </button>
      {isOpen && (
        <section className="gis-layer-panel" aria-label="Layer manager">
          <p>Layers</p>
          <label>
            <input
              type="checkbox"
              checked={layers.studyArea}
              onChange={() => onToggleLayer("studyArea")}
            />
            Study area
          </label>
        </section>
      )}
    </div>
  );
};

export default LayerControl;
