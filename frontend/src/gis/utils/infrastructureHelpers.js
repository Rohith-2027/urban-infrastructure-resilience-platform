import {
  Hospital,
  Flame,
  Shield,
  Zap,
  Droplets,
  Radio,
  GraduationCap,
  TrafficCone,
  Navigation,
  MapPin,
} from "lucide-react";

export const INFRASTRUCTURE_ICONS = {
  hospitals: Hospital,
  fireStations: Flame,
  policeStations: Shield,
  powerSubstations: Zap,
  waterInfrastructure: Droplets,
  communication: Radio,
  education: GraduationCap,
  trafficManagement: TrafficCone,
  roads: Navigation,
  "study-area": MapPin,
};

export const getInfrastructureIcon = (type) =>
  INFRASTRUCTURE_ICONS[type] || MapPin;

export const STATUS_CONFIG = {
  operational: { label: "Operational", className: "gis-badge--green" },
  active: { label: "Active", className: "gis-badge--green" },
  failure: { label: "Failure", className: "gis-badge--red" },
  failed: { label: "Failed", className: "gis-badge--red" },
  degraded: { label: "Degraded", className: "gis-badge--orange" },
  partial: { label: "Partial", className: "gis-badge--orange" },
  unknown: { label: "Unknown", className: "gis-badge--gray" },
};

export const getStatusConfig = (status) => {
  if (!status) return STATUS_CONFIG.unknown;
  const key = String(status).toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.unknown;
};

export const getRiskConfig = (score) => {
  const n = Number(score);
  if (Number.isNaN(n) || n < 0) return { level: "Unknown", className: "gis-risk--gray", width: 0 };
  if (n <= 25) return { level: "Low", className: "gis-risk--green", width: n };
  if (n <= 50) return { level: "Medium", className: "gis-risk--yellow", width: n };
  if (n <= 75) return { level: "High", className: "gis-risk--orange", width: n };
  return { level: "Critical", className: "gis-risk--red", width: Math.min(n, 100) };
};

const LABEL_MAP = {
  powerSubstations: "Power",
  communication: "Communication",
  roads: "Roads",
  hospitals: "Hospital",
  fireStations: "Fire",
  policeStations: "Police",
  waterInfrastructure: "Water",
  education: "Education",
  trafficManagement: "Traffic",
};

export const getChipLabel = (id) => LABEL_MAP[id] || id;

export const getChipIcon = (id) => {
  const Icon = INFRASTRUCTURE_ICONS[id];
  return Icon || null;
};

export const formatSource = (source) => {
  if (!source) return "Unknown";
  const s = String(source).toLowerCase();
  if (s === "overpass" || s === "osm") return "OpenStreetMap (Overpass)";
  if (s === "manual") return "Manual Infrastructure Dataset";
  return source;
};

const FALLBACK_NAME_MAP = {
  roads: "Unnamed Road",
  hospitals: "Unnamed Hospital",
  fireStations: "Unnamed Fire Station",
  policeStations: "Unnamed Police Station",
  powerSubstations: "Unnamed Power Substation",
  waterInfrastructure: "Unnamed Water Infrastructure",
  education: "Unnamed Educational Institution",
  communication: "Unnamed Communication Infrastructure",
  trafficManagement: "Unnamed Traffic Management",
};

export const getFallbackName = (infrastructureType) =>
  FALLBACK_NAME_MAP[infrastructureType] || "Unnamed Infrastructure";

export const ROAD_CLASS_MAP = {
  motorway: "National Highway",
  trunk: "National Highway",
  primary: "Primary Road",
  secondary: "Secondary Road",
  tertiary: "Tertiary Road",
  residential: "Residential Road",
  service: "Residential Road",
  unclassified: "Residential Road",
  living_street: "Residential Road",
};

export const getRoadClassName = (highway) =>
  ROAD_CLASS_MAP[highway] || "Other Road";

export const ROAD_COLORS = {
  motorway: "#dc2626",
  trunk: "#dc2626",
  primary: "#f97316",
  secondary: "#f97316",
  tertiary: "#eab308",
  residential: "#94a3b8",
  service: "#94a3b8",
  unclassified: "#94a3b8",
  living_street: "#94a3b8",
};
