import { useState } from "react";
import { Layer, Map, Source } from "react-map-gl/maplibre";
import { GIS_BASEMAP_STYLE, MAP_INITIAL_VIEW_STATE, MAP_INTERACTION_OPTIONS } from "../config/mapConfig";
import { getRenderableLayers } from "../config/layerRegistry";
import { useLayers } from "../hooks/useLayers";
import { MapProvider } from "../hooks/useMap";
import { useStudyArea } from "../hooks/useStudyArea";
import CoordinateDisplay from "./CoordinateDisplay";
import MapControls from "./MapControls";
import ScaleControl from "./ScaleControl";
import SearchControl from "./SearchControl";
import { useInfrastructureLayers } from "../../infrastructure/hooks/useInfrastructureLayers";

const MapCanvas = () => {
  const [map, setMap] = useState(null);
  const { data: studyArea, bounds: studyAreaBounds } = useStudyArea(map);
  const { layers, toggleLayer } = useLayers();
  const { layerData, layerRegistry } = useInfrastructureLayers(studyArea);
  const renderableLayers = getRenderableLayers(layerData);

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
      </Map>
      {map && (
        <MapProvider map={map}>
          <SearchControl map={map} />
          <MapControls
            studyAreaBounds={studyAreaBounds}
            layers={layers}
            layerRegistry={layerRegistry}
            onToggleLayer={toggleLayer}
          />
          <ScaleControl map={map} />
          <CoordinateDisplay map={map} />
        </MapProvider>
      )}
    </div>
  );
};

export default MapCanvas;
