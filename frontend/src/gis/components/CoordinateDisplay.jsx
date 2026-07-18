import { useEffect, useState } from "react";

const CoordinateDisplay = ({ map }) => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setCoordinates({ longitude: event.lngLat.lng, latitude: event.lngLat.lat });
    };

    const clearCoordinates = () => setCoordinates(null);
    map.on("mousemove", handleMouseMove);
    map.getCanvas().addEventListener("mouseleave", clearCoordinates);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.getCanvas().removeEventListener("mouseleave", clearCoordinates);
    };
  }, [map]);

  return (
    <output className="gis-coordinate-display" aria-label="Cursor coordinates">
      {coordinates
        ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
        : "Move cursor over map"}
    </output>
  );
};

export default CoordinateDisplay;
