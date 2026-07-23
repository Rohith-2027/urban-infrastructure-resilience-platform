const API_BASE_URL = "/api";

let graphCache = null;
let graphInflight = null;

export const getDependencyGraph = async () => {
  if (graphCache) return graphCache;

  if (graphInflight) return graphInflight;

  graphInflight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dependency/graph`);

      if (!response.ok) {
        throw new Error("Dependency graph data could not be loaded.");
      }

      const result = await response.json();
      const data = result.data;
      graphCache = data;
      return data;
    } catch (error) {
      console.warn("[DependencyService] Graph endpoint not available:", error.message);
      return { nodes: [], edges: [] };
    } finally {
      graphInflight = null;
    }
  })();

  return graphInflight;
};

export const getDependencyEdges = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dependency/edges`);

    if (!response.ok) {
      throw new Error("Dependency edges data could not be loaded.");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn("[DependencyService] Edges endpoint not available:", error.message);
    return [];
  }
};
