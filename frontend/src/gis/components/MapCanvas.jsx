import { useState } from "react";
import { Layer, Map, Source } from "react-map-gl/maplibre";
import { MAP_INITIAL_VIEW_STATE, MAP_INTERACTION_OPTIONS, OPEN_STREET_MAP_STYLE } from "../config/mapConfig";
import { STUDY_AREA_FILL_LAYER_ID, STUDY_AREA_OUTLINE_LAYER_ID, STUDY_AREA_SOURCE_ID } from "../constants/mapConstants";
import { useLayers } from "../hooks/useLayers";
import { MapProvider } from "../hooks/useMap";
import { useStudyArea } from "../hooks/useStudyArea";
import CoordinateDisplay from "./CoordinateDisplay";
import MapControls from "./MapControls";
import ScaleControl from "./ScaleControl";
import SearchControl from "./SearchControl";

const MapCanvas = () => {
  const [map, setMap] = useState(null);
  const { data: studyArea, bounds: studyAreaBounds } = useStudyArea(map);
  const { layers, toggleLayer } = useLayers();

  return (
    <div className="gis-map-canvas">
      <Map
        {...MAP_INTERACTION_OPTIONS}
        initialViewState={MAP_INITIAL_VIEW_STATE}
        mapStyle={OPEN_STREET_MAP_STYLE}
        maxPitch={75}
        onLoad={(event) => setMap(event.target)}
        attributionControl
      >
        <Source id={STUDY_AREA_SOURCE_ID} type="geojson" data={studyArea}>
          <Layer
            id={STUDY_AREA_FILL_LAYER_ID}
            type="fill"
            paint={{ "fill-color": "#2563eb", "fill-opacity": 0.16 }}
            layout={{ visibility: layers.studyArea ? "visible" : "none" }}
          />
          <Layer
            id={STUDY_AREA_OUTLINE_LAYER_ID}
            type="line"
            paint={{ "line-color": "#2563eb", "line-width": 3, "line-opacity": 0.95 }}
            layout={{ visibility: layers.studyArea ? "visible" : "none" }}
          />
        </Source>
      </Map>
      {map && (
        <MapProvider map={map}>
          <SearchControl map={map} />
          <MapControls studyAreaBounds={studyAreaBounds} layers={layers} onToggleLayer={toggleLayer} />
          <ScaleControl map={map} />
          <CoordinateDisplay map={map} />
        </MapProvider>
      )}
    </div>
  );
};

export default MapCanvas;
