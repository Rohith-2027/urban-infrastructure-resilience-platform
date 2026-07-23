import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DEPENDENCY_TYPE_COLORS, DEPENDENCY_TYPE_LABEL } from "../layers/dependencyLayer";

const LEGEND_ITEMS = [
  { type: "POWER_LINE", dash: false },
  { type: "FIBER_OPTIC", dash: false },
  { type: "WATER_PIPELINE", dash: false },
  { type: "EMERGENCY_ROUTE", dash: false },
  { type: "ROAD_ACCESS", dash: false },
];

const DependencyLegend = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="gis-dep-legend">
      <button
        className="gis-dep-legend-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand legend" : "Collapse legend"}
      >
        <span className="gis-dep-legend-title">Dependency Types</span>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {!collapsed && (
        <ul className="gis-dep-legend-list">
          {LEGEND_ITEMS.map(({ type, dash }) => (
            <li key={type} className="gis-dep-legend-item">
              <span
                className="gis-dep-legend-swatch"
                style={{
                  background: DEPENDENCY_TYPE_COLORS[type],
                  backgroundImage: dash
                    ? `repeating-linear-gradient(90deg, ${DEPENDENCY_TYPE_COLORS[type]} 0 4px, transparent 4px 8px)`
                    : undefined,
                }}
              />
              <span className="gis-dep-legend-label">{DEPENDENCY_TYPE_LABEL[type]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DependencyLegend;
