import { Layers } from "lucide-react";
import { useState } from "react";

const LayerControl = ({ layers, layerRegistry, onToggleLayer }) => {
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
          {layerRegistry.map((layer) => (
            <label key={layer.id}>
              <input
                type="checkbox"
                checked={layers[layer.id]}
                disabled={layer.dataStatus !== "ready"}
                onChange={() => onToggleLayer(layer.id)}
              />
              {layer.displayName}
              {layer.dataStatus !== "ready" && (
                <span role={layer.dataStatus === "error" ? "alert" : undefined}>
                  {layer.dataStatus === "error" ? layer.error : layer.dataStatus}
                </span>
              )}
            </label>
          ))}
        </section>
      )}
    </div>
  );
};

export default LayerControl;
