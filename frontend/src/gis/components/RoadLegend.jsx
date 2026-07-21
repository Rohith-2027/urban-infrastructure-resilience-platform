import { ROAD_COLORS } from "../utils/infrastructureHelpers";

const ENTRIES = [
  { highway: "motorway", label: "National Highway" },
  { highway: "trunk", label: "National Highway" },
  { highway: "primary", label: "Primary Road" },
  { highway: "secondary", label: "Secondary Road" },
  { highway: "tertiary", label: "Tertiary Road" },
  { highway: "residential", label: "Residential Road" },
];

const uniqueEntries = [];
const seen = new Set();
for (const entry of ENTRIES) {
  if (!seen.has(entry.label)) {
    seen.add(entry.label);
    uniqueEntries.push(entry);
  }
}

const RoadLegend = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="gis-road-legend">
      <span className="gis-road-legend-title">Road Class</span>
      <ul className="gis-road-legend-list">
        {uniqueEntries.map(({ highway, label }) => (
          <li key={label} className="gis-road-legend-item">
            <span
              className="gis-road-legend-swatch"
              style={{ background: ROAD_COLORS[highway] }}
            />
            <span className="gis-road-legend-label">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoadLegend;
