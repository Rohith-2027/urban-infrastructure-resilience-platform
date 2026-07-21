import { useEffect, useState, useCallback } from "react";
import { Layer, Map, Marker, Popup, Source } from "react-map-gl/maplibre";
import { GIS_BASEMAP_STYLE, MAP_INITIAL_VIEW_STATE, MAP_INTERACTION_OPTIONS } from "../config/mapConfig";
import { getRenderableLayers } from "../config/layerRegistry";
import { useLayers } from "../hooks/useLayers";
import { MapProvider } from "../hooks/useMap";
import { useStudyArea } from "../hooks/useStudyArea";
import CoordinateDisplay from "./CoordinateDisplay";
import InfrastructureDetailDrawer from "./InfrastructureDetailDrawer";
import MapControls from "./MapControls";
import ScaleControl from "./ScaleControl";
import SearchControl from "./SearchControl";
import RoadLegend from "./RoadLegend";
import { useInfrastructureLayers } from "../../infrastructure/hooks/useInfrastructureLayers";
import { getInfrastructureIcon, getStatusConfig, getFallbackName } from "../utils/infrastructureHelpers";

const MapCanvas = () => {
  const [map, setMap] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [drawerProps, setDrawerProps] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [searchMarkerPopup, setSearchMarkerPopup] = useState(null);
  const { data: studyArea, bounds: studyAreaBounds } = useStudyArea(map);
  const { layers, toggleLayer } = useLayers();
  const { layerData, layerRegistry } = useInfrastructureLayers(studyArea);
  const renderableLayers = getRenderableLayers(layerData);

  const openDrawer = useCallback((props) => {
    setDrawerProps(props);
    setPopupInfo(null);
  }, []);

  const closeDrawer = useCallback(() => setDrawerProps(null), []);

  const handleSearchResult = useCallback((marker) => {
    setSearchMarker(marker);
    setSearchMarkerPopup(null);
  }, []);

  console.group("[MapCanvas] Renderable Layers");
  renderableLayers.forEach(layer => {
    console.log({
      id: layer.id,
      dataStatus: layer.dataStatus,
      featureCount: layer.source?.data?.features?.length ?? 0,
      visible: layers[layer.id],
    });
  });
  console.groupEnd();

  useEffect(() => {
    if (!map) return undefined;

    const onClick = (event) => {
      const layerIds = renderableLayers
        .filter((layer) => layers[layer.id])
        .flatMap((layer) => layer.layers.map((l) => l.id));

      if (layerIds.length === 0) {
        setPopupInfo(null);
        return;
      }

      const features = map.queryRenderedFeatures(event.point, { layers: layerIds });

      if (features.length > 0) {
        const feature = features[0];
        setPopupInfo({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          properties: feature.properties,
        });
      } else {
        setPopupInfo(null);
      }
    };

    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [map, renderableLayers, layers]);

  return (
    <div className="gis-map-canvas">
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
                      onClick={() => openDrawer(popupInfo.properties)}
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
      {drawerProps && (
        <InfrastructureDetailDrawer properties={drawerProps} onClose={closeDrawer} />
      )}
      {map && (
        <MapProvider map={map}>
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
        </MapProvider>
      )}
    </div>
  );
};

export default MapCanvas;
