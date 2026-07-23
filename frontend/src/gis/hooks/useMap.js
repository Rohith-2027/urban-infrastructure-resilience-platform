import { createContext, createElement, useContext } from "react";

const GISContext = createContext(null);

export const MapProvider = ({ map, dependencyGraph, dependencyEdges, dependencyLoading, dependencyError, refreshDependencyGraph, children }) =>
  createElement(
    GISContext.Provider,
    {
      value: {
        map,
        dependencyGraph,
        dependencyEdges,
        dependencyLoading,
        dependencyError,
        refreshDependencyGraph,
      },
    },
    children,
  );

export const useMap = () => {
  const ctx = useContext(GISContext);

  if (!ctx) {
    throw new Error("useMap must be used within a ready MapProvider.");
  }

  return ctx.map;
};

export const useDependencyContext = () => {
  const ctx = useContext(GISContext);

  if (!ctx) {
    throw new Error("useDependencyContext must be used within a ready MapProvider.");
  }

  return {
    dependencyGraph: ctx.dependencyGraph,
    dependencyEdges: ctx.dependencyEdges,
    dependencyLoading: ctx.dependencyLoading,
    dependencyError: ctx.dependencyError,
    refreshDependencyGraph: ctx.refreshDependencyGraph,
  };
};
