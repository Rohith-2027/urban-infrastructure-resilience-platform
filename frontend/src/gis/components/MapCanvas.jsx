import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Layer, Map, Marker, Popup, Source } from "react-map-gl/maplibre";

import { GIS_BASEMAP_STYLE, MAP_INITIAL_VIEW_STATE, MAP_INTERACTION_OPTIONS } from "../config/mapConfig";
import { getRenderableLayers } from "../config/layerRegistry";
import { useLayers } from "../hooks/useLayers";
import { MapProvider } from "../hooks/useMap";
import { useStudyArea } from "../hooks/useStudyArea";
import { useDependencyGraph } from "../dependency/useDependencyGraph";
import { filterEdgesByNodeId } from "../dependency/dependencyUtils";
import {
  DEPENDENCY_SOURCE_ID,
  DEPENDENCY_LAYER_ID,
  DEPENDENCY_LAYER_SELECTED_ID,
  DEPENDENCY_TYPE_COLORS,
  DEPENDENCY_TYPE_LABEL,
  createDependencySource,
  createDependencyLayer,
} from "../layers/dependencyLayer";
import CoordinateDisplay from "./CoordinateDisplay";
import InfrastructureDetailDrawer from "./InfrastructureDetailDrawer";
import MapControls from "./MapControls";
import ScaleControl from "./ScaleControl";
import SearchControl from "./SearchControl";
import RoadLegend from "./RoadLegend";
import DependencyLegend from "./DependencyLegend";
import { useInfrastructureLayers } from "../../infrastructure/hooks/useInfrastructureLayers";
import {
  getInfrastructureIcon,
  getStatusConfig,
  getFallbackName,
} from "../utils/infrastructureHelpers";

const HIGHLIGHT_OPACITY = 0.3;
const CONNECTED_MARKER_RADIUS = 7;
const DEFAULT_MARKER_RADIUS = 5;

const MapCanvas = () => {
  const [map, setMap] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [drawerProps, setDrawerProps] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [searchMarkerPopup, setSearchMarkerPopup] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edgeTooltip, setEdgeTooltip] = useState(null);

  const hoveredEdgeIdRef = useRef(null);
  const hoveredNodeIdRef = useRef(null);
  const prevHighlightRef = useRef(null);
  const layerUpdateRef = useRef({ prevSelected: null, prevConnected: null });
  const hasZoomedRef = useRef(false);

  const { data: studyArea, bounds: studyAreaBounds } = useStudyArea(map);
  const { layers, toggleLayer } = useLayers();
  const { layerData, layerRegistry } = useInfrastructureLayers(studyArea);
  const {
    graph: dependencyGraph,
    edges: dependencyEdges,
    loading: dependencyLoading,
    error: dependencyError,
    refresh: refreshDependencyGraph,
  } = useDependencyGraph();

  const visibleEdges = useMemo(
    () => (selectedNodeId ? filterEdgesByNodeId(dependencyEdges, selectedNodeId) : []),
    [dependencyEdges, selectedNodeId]
  );

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId || visibleEdges.length === 0) return new Set();
    const ids = new Set([selectedNodeId]);
    for (const edge of visibleEdges) {
      if (edge.source?.id) ids.add(edge.source.id);
      if (edge.target?.id) ids.add(edge.target.id);
    }
    return ids;
  }, [selectedNodeId, visibleEdges]);

  const infraCoords = useMemo(() => {
    const map = {};
    for (const edge of dependencyEdges) {
      if (edge.source?.id && edge.source?.latitude != null && edge.source?.longitude != null) {
        map[edge.source.id] = [edge.source.longitude, edge.source.latitude];
      }
      if (edge.target?.id && edge.target?.latitude != null && edge.target?.longitude != null) {
        map[edge.target.id] = [edge.target.longitude, edge.target.latitude];
      }
    }
    return map;
  }, [dependencyEdges]);

  const renderableLayers = useMemo(() => getRenderableLayers(layerData), [layerData]);
  const { normal: depNormal, selected: depSelected } = useMemo(
    () => createDependencyLayer(selectedEdgeId),
    [selectedEdgeId]
  );
  const dependencyVis = visibleEdges.length > 0 ? "visible" : "none";

  const openDrawer = useCallback((props, nodeId) => {
    setDrawerProps(props);
    setSelectedNodeId(nodeId || null);
    setPopupInfo(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerProps(null);
    setSelectedNodeId(null);
  }, []);

  const handleSearchResult = useCallback((marker) => {
    setSearchMarker(marker);
    setSearchMarkerPopup(null);
  }, []);

  /* ── Part 3: Zoom To Connected Network ── */
  useEffect(() => {
    if (!map) return;

    if (!selectedNodeId) {
      if (hasZoomedRef.current && studyAreaBounds) {
        map.fitBounds(studyAreaBounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 350 },
          duration: 900,
          essential: true,
        });
        hasZoomedRef.current = false;
      }
      return;
    }

    const selectedCoord = infraCoords[selectedNodeId];
    const points = selectedCoord ? [selectedCoord] : [];
    for (const id of connectedNodeIds) {
      if (id !== selectedNodeId && infraCoords[id]) points.push(infraCoords[id]);
    }

    if (points.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [lng, lat] of points) {
      minX = Math.min(minX, lng);
      minY = Math.min(minY, lat);
      maxX = Math.max(maxX, lng);
      maxY = Math.max(maxY, lat);
    }

    if (!isFinite(minX)) return;

    map.fitBounds(
      [[minX, minY], [maxX, maxY]],
      { padding: { top: 60, bottom: 60, left: 60, right: 380 }, maxZoom: 16, duration: 900, essential: true }
    );
    hasZoomedRef.current = true;
  }, [map, selectedNodeId, connectedNodeIds, infraCoords, studyAreaBounds]);

  /* ── Parts 1,2,4,5: Click, hover, edge animation, pulse, tooltip, highlight ── */
  useEffect(() => {
    if (!map) return undefined;

    const infrastructureLayerIds = renderableLayers
      .filter((l) => layers[l.id])
      .flatMap((l) => l.layers.map((ml) => ml.id));

    const onMapClick = (event) => {
      setPopupInfo(null);
      setEdgeTooltip(null);
      hoveredEdgeIdRef.current = null;
      hoveredNodeIdRef.current = null;

      const depFeatures = map.queryRenderedFeatures(event.point, {
        layers: [DEPENDENCY_LAYER_ID, DEPENDENCY_LAYER_SELECTED_ID],
      });
      if (depFeatures.length > 0) {
        const feature = depFeatures[0];
        setSelectedEdgeId(feature.properties.id);
        return;
      }

      if (infrastructureLayerIds.length > 0) {
        const features = map.queryRenderedFeatures(event.point, { layers: infrastructureLayerIds });
        if (features.length > 0) {
          const feature = features[0];
          setSelectedEdgeId(null);
          setSelectedNodeId(feature.properties.nodeId || null);
          setPopupInfo({
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
            properties: feature.properties,
          });
          return;
        }
      }

      setSelectedEdgeId(null);
      setSelectedNodeId(null);
    };

    /* ── Part 4: Rich Edge Tooltip ── */
    const onEdgeMouseMove = (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [DEPENDENCY_LAYER_ID, DEPENDENCY_LAYER_SELECTED_ID],
      });
      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";

      if (features.length > 0) {
        const f = features[0];
        const id = f.properties?.id;
        hoveredEdgeIdRef.current = id;

        if (map.getLayer(DEPENDENCY_LAYER_ID)) {
          map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-width", [
            "interpolate", ["linear"], ["zoom"],
            10, ["case", ["==", ["id"], id], 5, 2],
            15, ["case", ["==", ["id"], id], 5, 3],
            18, ["case", ["==", ["id"], id], 5, 5],
          ]);
          map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", [
            "case", ["==", ["id"], id], 1, 0.8,
          ]);
        }

        const p = f.properties;
        const typeColor = DEPENDENCY_TYPE_COLORS[p.type] || "#3b82f6";
        const typeLabel = DEPENDENCY_TYPE_LABEL[p.type] || p.type;
        const rank = p.providerRank;
        const limit = p.providerLimit;
        setEdgeTooltip({
          x: event.originalEvent.clientX,
          y: event.originalEvent.clientY,
          data: {
            typeLabel, typeColor,
            sourceName: p.sourceName || "Unknown",
            targetName: p.targetName || "Unknown",
            role: rank != null && limit > 1 ? (rank === 1 ? "Primary" : "Backup") : null,
            distance: p.distance,
            strength: p.dependencyStrength,
            status: p.status,
            weight: p.weight,
          },
        });
      } else {
        hoveredEdgeIdRef.current = null;
        setEdgeTooltip(null);
        if (map.getLayer(DEPENDENCY_LAYER_ID)) {
          map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-width", [
            "interpolate", ["linear"], ["zoom"], 10, 2, 15, 3, 18, 5,
          ]);
          map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", 0.8);
        }
      }
    };

    const onEdgeMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      hoveredEdgeIdRef.current = null;
      setEdgeTooltip(null);
      if (map.getLayer(DEPENDENCY_LAYER_ID)) {
        map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-width", [
          "interpolate", ["linear"], ["zoom"], 10, 2, 15, 3, 18, 5,
        ]);
        map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", 0.8);
      }
    };

    /* ── Part 5: Hover Network Highlight ── */
    const onInfraMouseMove = (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: infrastructureLayerIds });
      const nodeId = features.length > 0 ? features[0].properties?.nodeId : null;

      if (nodeId === hoveredNodeIdRef.current) return;
      hoveredNodeIdRef.current = nodeId;

      if (!nodeId) {
        if (prevHighlightRef.current && map.getLayer(DEPENDENCY_LAYER_ID)) {
          map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", prevHighlightRef.current);
          prevHighlightRef.current = null;
        }
        return;
      }

      if (prevHighlightRef.current == null) {
        if (map.getLayer(DEPENDENCY_LAYER_ID)) {
          prevHighlightRef.current = map.getPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity");
        }
      }

      const connectedEdgeIds = new Set();
      for (const e of visibleEdges) {
        if (e.source?.id === nodeId || e.target?.id === nodeId) connectedEdgeIds.add(e.id);
      }

      if (connectedEdgeIds.size > 0 && map.getLayer(DEPENDENCY_LAYER_ID)) {
        map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", [
          "case", ["in", ["id"], ["literal", Array.from(connectedEdgeIds)]], 1, 0.15,
        ]);
      }
    };

    const onInfraMouseLeave = () => {
      hoveredNodeIdRef.current = null;
      if (prevHighlightRef.current != null && map.getLayer(DEPENDENCY_LAYER_ID)) {
        map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity", prevHighlightRef.current);
        prevHighlightRef.current = null;
      }
    };

    if (map.getLayer(DEPENDENCY_LAYER_ID)) {
      map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-width-transition", { duration: 250 });
      map.setPaintProperty(DEPENDENCY_LAYER_ID, "line-opacity-transition", { duration: 250 });
    }

    map.on("click", onMapClick);
    if (map.getLayer(DEPENDENCY_LAYER_ID)) {
      map.on("mousemove", DEPENDENCY_LAYER_ID, onEdgeMouseMove);
      map.on("mouseleave", DEPENDENCY_LAYER_ID, onEdgeMouseLeave);
    }
    if (map.getLayer(DEPENDENCY_LAYER_SELECTED_ID)) {
      map.on("mousemove", DEPENDENCY_LAYER_SELECTED_ID, onEdgeMouseMove);
      map.on("mouseleave", DEPENDENCY_LAYER_SELECTED_ID, onEdgeMouseLeave);
    }
    for (const layerId of infrastructureLayerIds) {
      map.on("mousemove", layerId, onInfraMouseMove);
      map.on("mouseleave", layerId, onInfraMouseLeave);
    }

    return () => {
      map.off("click", onMapClick);
      map.off("mousemove", DEPENDENCY_LAYER_ID, onEdgeMouseMove);
      map.off("mousemove", DEPENDENCY_LAYER_SELECTED_ID, onEdgeMouseMove);
      map.off("mouseleave", DEPENDENCY_LAYER_ID, onEdgeMouseLeave);
      map.off("mouseleave", DEPENDENCY_LAYER_SELECTED_ID, onEdgeMouseLeave);
      for (const layerId of infrastructureLayerIds) {
        map.off("mousemove", layerId, onInfraMouseMove);
        map.off("mouseleave", layerId, onInfraMouseLeave);
      }
    };
  }, [map, renderableLayers, layers, visibleEdges]);

  /* ── Part 2 + Connected Highlight: Marker radius/opacity ── */
  useEffect(() => {
    if (!map) return;

    const update = () => {
      const { prevSelected, prevConnected } = layerUpdateRef.current;
      if (prevSelected === selectedNodeId && prevConnected === connectedNodeIds) return;
      layerUpdateRef.current = { prevSelected: selectedNodeId, prevConnected: connectedNodeIds };

      const style = map.getStyle();
      if (!style?.layers) return;

      for (const layer of style.layers) {
        if (layer.type !== "circle") continue;
        const id = layer.id;
        const isHalo = id.endsWith("-halo");
        const isMarker = id.endsWith("-marker");
        if (!isHalo && !isMarker) continue;

        const layerDef = renderableLayers.find((l) => l.layers.some((ml) => ml.id === id));
        if (!layerDef || !layers[layerDef.id]) continue;
        if (!map.getLayer(id)) continue;

        const originalRadius = isHalo ? 8 : DEFAULT_MARKER_RADIUS;

        if (!selectedNodeId) {
          map.setPaintProperty(id, "circle-opacity", 0.9);
          if (isMarker) map.setPaintProperty(id, "circle-radius", originalRadius);
          continue;
        }

        const connArray = Array.from(connectedNodeIds);

        if (isHalo) {
          map.setPaintProperty(id, "circle-opacity", [
            "case", ["==", ["get", "nodeId"], selectedNodeId], 1,
            ["in", ["get", "nodeId"], ["literal", connArray]], 1, HIGHLIGHT_OPACITY,
          ]);
          map.setPaintProperty(id, "circle-radius", [
            "case", ["==", ["get", "nodeId"], selectedNodeId], originalRadius + 4,
            originalRadius,
          ]);
        }

        if (isMarker) {
          map.setPaintProperty(id, "circle-opacity", [
            "case", ["==", ["get", "nodeId"], selectedNodeId], 1,
            ["in", ["get", "nodeId"], ["literal", connArray]], 1, HIGHLIGHT_OPACITY,
          ]);
          map.setPaintProperty(id, "circle-radius", [
            "case",
            ["==", ["get", "nodeId"], selectedNodeId], CONNECTED_MARKER_RADIUS + 2,
            ["in", ["get", "nodeId"], ["literal", connArray]], CONNECTED_MARKER_RADIUS,
            originalRadius,
          ]);
        }
      }
    };

    map.on("sourcedataloading", update);
    update();

    return () => { map.off("sourcedataloading", update); };
  }, [map, selectedNodeId, connectedNodeIds, renderableLayers, layers]);

  return (
    <div className="gis-map-canvas" tabIndex={-1}>
      <Map
        {...MAP_INTERACTION_OPTIONS}
        initialViewState={MAP_INITIAL_VIEW_STATE}
        mapStyle={GIS_BASEMAP_STYLE}
        maxPitch={75}
        onLoad={(event) => setMap(event.target)}
        attributionControl
      >
        {renderableLayers.map((layer) => (
          <Source key={layer.source.id} {...layer.source}>
            {layer.layers.map((mapLayer) => (
              <Layer
                key={mapLayer.id}
                {...mapLayer}
                layout={{ ...mapLayer.layout, visibility: layers[layer.id] ? "visible" : "none" }}
              />
            ))}
          </Source>
        ))}
        <Source
          id={DEPENDENCY_SOURCE_ID}
          type="geojson"
          data={createDependencySource(visibleEdges)}
        >
          <Layer {...depNormal} layout={{ ...depNormal.layout, visibility: dependencyVis }} />
          <Layer {...depSelected} layout={{ ...depSelected.layout, visibility: dependencyVis }} />
        </Source>
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            offset={12}
          >
            <div className="gis-infrastructure-popup">
              {(() => {
                const Icon = getInfrastructureIcon(popupInfo.properties.infrastructureType);
                const statusCfg = getStatusConfig(popupInfo.properties.status);
                return (
                  <>
                    <div className="gis-popup-header">
                      <Icon size={16} className="gis-popup-icon" />
                      <h4 className="gis-popup-name">
                        {popupInfo.properties.name || getFallbackName(popupInfo.properties.infrastructureType)}
                      </h4>
                    </div>
                    {popupInfo.properties.infrastructureType && (
                      <p className="gis-popup-type">{popupInfo.properties.infrastructureType}</p>
                    )}
                    {popupInfo.properties.status && (
                      <span className={`gis-badge gis-badge--sm ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    )}
                    <button
                      className="gis-popup-detail-link"
                      onClick={() => openDrawer(popupInfo.properties, popupInfo.properties.nodeId)}
                    >
                      View Details
                    </button>
                  </>
                );
              })()}
            </div>
          </Popup>
        )}
        {searchMarker && (
          <>
            <Marker
              longitude={searchMarker.longitude}
              latitude={searchMarker.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSearchMarkerPopup((prev) => (prev ? null : searchMarker));
              }}
            >
              <div className="gis-search-marker">
                <div className="gis-search-marker-pulse" />
                <div className="gis-search-marker-dot" />
              </div>
            </Marker>
            {searchMarkerPopup && (
              <Popup
                longitude={searchMarkerPopup.longitude}
                latitude={searchMarkerPopup.latitude}
                anchor="bottom"
                offset={28}
                closeOnClick={false}
                onClose={() => setSearchMarkerPopup(null)}
              >
                <div className="gis-search-popup">
                  <span className="gis-search-popup-name">{searchMarkerPopup.name}</span>
                  <span className="gis-search-popup-coords">
                    {searchMarkerPopup.latitude.toFixed(4)}, {searchMarkerPopup.longitude.toFixed(4)}
                  </span>
                </div>
              </Popup>
            )}
          </>
        )}
      </Map>

      {edgeTooltip && (
        <div
          className="gis-edge-tooltip"
          style={{ left: edgeTooltip.x + 14, top: edgeTooltip.y - 10 }}
        >
          <div className="gis-edge-tooltip-header">
            <span className="gis-edge-tooltip-swatch" style={{ background: edgeTooltip.data.typeColor }} />
            <span className="gis-edge-tooltip-type">{edgeTooltip.data.typeLabel}</span>
          </div>
          <div className="gis-edge-tooltip-route">
            {edgeTooltip.data.sourceName} &rarr; {edgeTooltip.data.targetName}
          </div>
          <div className="gis-edge-tooltip-meta">
            {edgeTooltip.data.role && <div>Role: <strong>{edgeTooltip.data.role}</strong></div>}
            {edgeTooltip.data.distance != null && <div>Distance: {edgeTooltip.data.distance} km</div>}
            {edgeTooltip.data.strength != null && <div>Strength: {edgeTooltip.data.strength}</div>}
            {edgeTooltip.data.status && <div>Status: {edgeTooltip.data.status}</div>}
            {edgeTooltip.data.weight != null && <div>Weight: {edgeTooltip.data.weight}</div>}
          </div>
        </div>
      )}

      {map && (
        <MapProvider
          map={map}
          dependencyGraph={dependencyGraph}
          dependencyEdges={dependencyEdges}
          dependencyLoading={dependencyLoading}
          dependencyError={dependencyError}
          refreshDependencyGraph={refreshDependencyGraph}
        >
          {drawerProps && (
            <InfrastructureDetailDrawer properties={drawerProps} selectedNodeId={selectedNodeId} onClose={closeDrawer} />
          )}
          <SearchControl map={map} onSearchResult={handleSearchResult} />
          <MapControls
            studyAreaBounds={studyAreaBounds}
            layers={layers}
            layerRegistry={layerRegistry}
            onToggleLayer={toggleLayer}
          />
          <ScaleControl map={map} />
          <CoordinateDisplay map={map} />
          <RoadLegend visible={!!layers.roads} />
          <DependencyLegend />
        </MapProvider>
      )}
    </div>
  );
};

export default MapCanvas;
