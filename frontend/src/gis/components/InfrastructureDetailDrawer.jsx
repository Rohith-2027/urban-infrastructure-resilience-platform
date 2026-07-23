import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { X, Copy, Check } from "lucide-react";
import { useDependencyContext } from "../hooks/useMap";
import { getIncomingEdges, getOutgoingEdges } from "../dependency/dependencyUtils";
import {
  DEPENDENCY_TYPE_COLORS,
  DEPENDENCY_TYPE_LABEL,
} from "../layers/dependencyLayer";
import {
  getInfrastructureIcon,
  getStatusConfig,
  getRiskConfig,
  getChipLabel,
  getChipIcon,
  formatSource,
  getFallbackName,
} from "../utils/infrastructureHelpers";

const NA = "Not Available";

const TARGET_LAYER_LABELS = {
  hospitals: "Hospitals",
  education: "Schools",
  policeStations: "Police",
  fireStations: "Fire Stations",
  communication: "Communication",
  waterInfrastructure: "Water",
  trafficManagement: "Traffic",
};

const Field = ({ label, value }) => {
  const display = value != null && value !== "" ? value : NA;
  return (
    <div className="gis-drawer-field">
      <span className="gis-drawer-label">{label}</span>
      <span className="gis-drawer-value">{display}</span>
    </div>
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      className="gis-copy-btn"
      onClick={handleCopy}
      aria-label={`Copy ${text}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

const SectionCard = ({ title, children, delay = 0 }) => (
  <section className="gis-drawer-card" style={{ animationDelay: `${delay}ms` }}>
    <h4 className="gis-drawer-card-title">{title}</h4>
    {children}
  </section>
);

const StatusBadge = ({ value }) => {
  const config = getStatusConfig(value);
  return <span className={`gis-badge ${config.className}`}>{config.label}</span>;
};

const NodeIdBadge = ({ value }) => {
  if (!value) return <span className="gis-drawer-value gis-value--na">{NA}</span>;
  return <span className="gis-node-badge">{value}</span>;
};

const RiskBar = ({ score }) => {
  const config = getRiskConfig(score);
  const display = Number(score);
  const hasScore = !Number.isNaN(display) && display >= 0;

  return (
    <div className="gis-risk">
      <div className="gis-risk-header">
        <span className="gis-risk-score">{hasScore ? `${display} / 100` : NA}</span>
        {hasScore && <span className={`gis-risk-label ${config.className}`}>{config.level}</span>}
      </div>
      {hasScore && (
        <div className="gis-risk-track">
          <div
            className={`gis-risk-fill ${config.className}`}
            style={{ width: `${config.width}%` }}
          />
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, value }) => (
  <div className="gis-dep-stat-row">
    <span className="gis-dep-stat-label">{label}</span>
    <span className="gis-dep-stat-value">{value}</span>
  </div>
);

const DependencyStatsCard = ({ edges }) => {
  const stats = useMemo(() => {
    if (!edges || edges.length === 0) return null;

    const uniqueTargets = new Set();
    const connectedNodes = new Set();
    const byLayer = {};

    for (const edge of edges) {
      if (edge.target?.id) uniqueTargets.add(edge.target.id);
      if (edge.source?.id) connectedNodes.add(edge.source.id);
      if (edge.target?.id) connectedNodes.add(edge.target.id);

      const layer = edge.target?.layer;
      if (layer) {
        byLayer[layer] = (byLayer[layer] || 0) + 1;
      }
    }

    return {
      totalDependencies: edges.length,
      totalSupported: uniqueTargets.size,
      totalConnected: connectedNodes.size,
      byLayer,
    };
  }, [edges]);

  if (!stats) return null;

  return (
    <div className="gis-dep-stats">
      <div className="gis-dep-stats-grid">
        <StatRow label="Total Dependencies" value={stats.totalDependencies} />
        <StatRow label="Supported Infrastructure" value={stats.totalSupported} />
        <StatRow label="Connected Nodes" value={stats.totalConnected} />
      </div>
      {Object.keys(TARGET_LAYER_LABELS).length > 0 && (
        <div className="gis-dep-stats-breakdown">
          {Object.entries(TARGET_LAYER_LABELS).map(([layer, label]) => {
            const count = stats.byLayer[layer] || 0;
            return (
              <div key={layer} className="gis-dep-stats-item">
                <span className="gis-dep-stats-item-label">{label}</span>
                <span className="gis-dep-stats-item-value">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DependencyEdgeItem = ({ edge, direction }) => {
  const isIncoming = direction === "incoming";
  const node = isIncoming ? edge.source : edge.target;
  const edgeType = edge.edgeType || edge.type;
  const typeColor = DEPENDENCY_TYPE_COLORS[edgeType] || "#3b82f6";
  const typeLabel = DEPENDENCY_TYPE_LABEL[edgeType] || edgeType;
  const NodeIcon = node?.layer ? getChipIcon(node.layer) : null;
  const rank = edge.providerRank;
  const limit = edge.providerLimit;
  const roleLabel = rank != null && limit > 1 ? (rank === 1 ? "Primary" : "Backup") : null;
  const distance = edge.distance;
  const strength = edge.dependencyStrength;
  const status = edge.status || edge.edgeStatus;

  return (
    <div className="gis-dep-edge-item">
      <div className="gis-dep-edge-node">
        {NodeIcon && <NodeIcon size={14} className="gis-dep-edge-node-icon" />}
        <div className="gis-dep-edge-node-info">
          <span className="gis-dep-edge-node-name">
            {node?.name || getFallbackName(node?.type) || "Unknown"}
          </span>
          <div className="gis-dep-edge-node-meta">
            {node?.type && <span className="gis-dep-edge-node-type">{node.type}</span>}
            {node?.layer && <span className="gis-dep-edge-node-sector">{getChipLabel(node.layer)}</span>}
          </div>
          <div className="gis-dep-edge-detail-row">
            {status && (
              <span className="gis-dep-edge-detail">
                <span className="gis-dep-edge-detail-label">Status:</span> {status}
              </span>
            )}
            {distance != null && (
              <span className="gis-dep-edge-detail">
                <span className="gis-dep-edge-detail-label">Distance:</span> {distance} km
              </span>
            )}
            {strength != null && (
              <span className="gis-dep-edge-detail">
                <span className="gis-dep-edge-detail-label">Strength:</span> {strength}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="gis-dep-edge-badges">
        {roleLabel && (
          <span className={`gis-dep-edge-role-badge gis-dep-edge-role-badge--${rank === 1 ? "primary" : "backup"}`}>
            {roleLabel}
          </span>
        )}
        <span className="gis-dep-edge-type-badge" style={{ background: typeColor, color: "#fff" }}>
          {typeLabel}
        </span>
      </div>
    </div>
  );
};

const InfrastructureDetailDrawer = ({ properties, selectedNodeId, onClose }) => {
  const panelRef = useRef(null);
  const { dependencyEdges } = useDependencyContext();

  const handleClose = useCallback(() => {
    const mapCanvas = document.querySelector(".gis-map-canvas");
    if (mapCanvas) mapCanvas.focus();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, []);

  const p = properties;
  const nodeId = p ? (selectedNodeId || p.nodeId) : null;

  const incomingEdges = useMemo(
    () => (nodeId ? getIncomingEdges(dependencyEdges, nodeId) : []),
    [dependencyEdges, nodeId]
  );

  const outgoingEdges = useMemo(
    () => (nodeId ? getOutgoingEdges(dependencyEdges, nodeId) : []),
    [dependencyEdges, nodeId]
  );

  if (!properties) return null;
  const Icon = getInfrastructureIcon(p.infrastructureType);

  return (
    <div className="gis-drawer-backdrop" onClick={handleClose}>
      <aside
        className="gis-drawer-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Infrastructure detail"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gis-drawer-header">
          <div className="gis-drawer-header-left">
            <span className="gis-drawer-header-icon">
              <Icon size={22} />
            </span>
            <div className="gis-drawer-header-text">
              <h3 className="gis-drawer-title">
                {p.name || getFallbackName(p.infrastructureType)}
              </h3>
              <div className="gis-drawer-header-meta">
                {p.sector && <span className="gis-drawer-sector">{p.sector}</span>}
                {p.nodeId && <span className="gis-node-badge gis-node-badge--header">{p.nodeId}</span>}
                {p.status && <StatusBadge value={p.status} />}
              </div>
            </div>
          </div>
          <button className="gis-drawer-close" onClick={handleClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="gis-drawer-body">
          <SectionCard title="General Information" delay={0}>
            <Field label="Name" value={p.name || getFallbackName(p.infrastructureType)} />
            <div className="gis-drawer-field">
              <span className="gis-drawer-label">Node ID</span>
              <NodeIdBadge value={p.nodeId} />
            </div>
            <Field label="Sector" value={p.sector} />
            <Field label="Type" value={p.infrastructureType} />
            {p.roadClass && <Field label="Road Class" value={p.roadClass} />}
            <div className="gis-drawer-field">
              <span className="gis-drawer-label">Status</span>
              {p.status ? <StatusBadge value={p.status} /> : <span className="gis-drawer-value gis-value--na">{NA}</span>}
            </div>
            <div className="gis-drawer-field">
              <span className="gis-drawer-label">Failure State</span>
              {p.failureState ? <StatusBadge value={p.failureState} /> : <span className="gis-drawer-value gis-value--na">{NA}</span>}
            </div>
            <div className="gis-drawer-field">
              <span className="gis-drawer-label">Risk Score</span>
              <RiskBar score={p.riskScore} />
            </div>
            <Field
              label="Est. Recovery Time"
              value={p.estimatedRecoveryTime != null ? `${p.estimatedRecoveryTime} min` : null}
            />
          </SectionCard>

          <SectionCard title="Location" delay={50}>
            {p.representativeLatitude != null ? (
              <>
                <div className="gis-drawer-field">
                  <span className="gis-drawer-label">Representative Latitude</span>
                  <span className="gis-drawer-value gis-coord-value">
                    {Number(p.representativeLatitude).toFixed(6)}
                    <CopyButton text={Number(p.representativeLatitude).toFixed(6)} />
                  </span>
                </div>
                <div className="gis-drawer-field">
                  <span className="gis-drawer-label">Representative Longitude</span>
                  <span className="gis-drawer-value gis-coord-value">
                    {Number(p.representativeLongitude).toFixed(6)}
                    <CopyButton text={Number(p.representativeLongitude).toFixed(6)} />
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="gis-drawer-field">
                  <span className="gis-drawer-label">Latitude</span>
                  <span className="gis-drawer-value gis-coord-value">
                    {p.latitude != null ? Number(p.latitude).toFixed(6) : NA}
                    {p.latitude != null && <CopyButton text={Number(p.latitude).toFixed(6)} />}
                  </span>
                </div>
                <div className="gis-drawer-field">
                  <span className="gis-drawer-label">Longitude</span>
                  <span className="gis-drawer-value gis-coord-value">
                    {p.longitude != null ? Number(p.longitude).toFixed(6) : NA}
                    {p.longitude != null && <CopyButton text={Number(p.longitude).toFixed(6)} />}
                  </span>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Dependencies" delay={100}>
            {incomingEdges.length === 0 ? (
              <p className="gis-drawer-empty">No dependencies.</p>
            ) : (
              <div className="gis-dep-edge-list">
                {incomingEdges.map((edge) => (
                  <DependencyEdgeItem key={edge.id} edge={edge} direction="incoming" />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Supports" delay={150}>
            <DependencyStatsCard edges={outgoingEdges} />
            {outgoingEdges.length === 0 ? (
              <p className="gis-drawer-empty">No supported infrastructures.</p>
            ) : (
              <div className="gis-dep-edge-list">
                {outgoingEdges.map((edge) => (
                  <DependencyEdgeItem key={edge.id} edge={edge} direction="outgoing" />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Metadata" delay={200}>
            <div className="gis-drawer-field">
              <span className="gis-drawer-label">Source</span>
              <span className="gis-drawer-value">{formatSource(p.source)}</span>
            </div>
            <Field label="Verification Status" value={p.verificationStatus} />
          </SectionCard>
        </div>
      </aside>
    </div>
  );
};

export default InfrastructureDetailDrawer;
