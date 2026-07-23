import { useState, useEffect, useCallback } from "react";
import { getDependencyGraph } from "./dependencyService";

export const useDependencyGraph = () => {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const graphData = await getDependencyGraph();

      const safeGraph = graphData && typeof graphData === "object" && Array.isArray(graphData.nodes)
        ? graphData
        : { nodes: [], edges: [] };

      setGraph(safeGraph);
      setEdges(safeGraph.edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dependency data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    graph,
    edges,
    loading,
    error,
    refresh,
  };
};
