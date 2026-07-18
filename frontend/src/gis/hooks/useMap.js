import { createContext, createElement, useContext } from "react";

const MapContext = createContext(null);

export const MapProvider = ({ map, children }) =>
  createElement(MapContext.Provider, { value: map }, children);

export const useMap = () => {
  const map = useContext(MapContext);

  if (!map) {
    throw new Error("useMap must be used within a ready MapProvider.");
  }

  return map;
};
