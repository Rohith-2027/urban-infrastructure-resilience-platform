import { useEffect, useRef, useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import {
  getInfrastructureIcon,
  getStatusConfig,
  getRiskConfig,
  getChipLabel,
  getChipIcon,
  formatSource,
  getFallbackName,
  getRoadClassName,
} from "../utils/infrastructureHelpers";

const NA = "Not Available";

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

const ChipList = ({ items, emptyText }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="gis-drawer-empty">{emptyText}</p>;
  }

  return (
    <div className="gis-chip-list">
      {items.map((id, i) => {
        const Icon = getChipIcon(id);
        return (
          <span key={`${id}-${i}`} className="gis-chip">
            {Icon && <Icon size={13} className="gis-chip-icon" />}
            {getChipLabel(id)}
          </span>
        );
      })}
    </div>
  );
};

const InfrastructureDetailDrawer = ({ properties, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, []);

  if (!properties) return null;

  const p = properties;
  const Icon = getInfrastructureIcon(p.infrastructureType);
  const deps = p.dependencies || p.dependsOn;
  const sups = p.supports;
  const statusCfg = getStatusConfig(p.status);

  return (
    <div className="gis-drawer-backdrop" onClick={onClose} aria-hidden="true">
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
          <button className="gis-drawer-close" onClick={onClose} aria-label="Close drawer">
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
            <ChipList items={deps} emptyText="No dependencies available" />
          </SectionCard>

          <SectionCard title="Supports" delay={150}>
            <ChipList items={sups} emptyText="No supported infrastructures" />
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
