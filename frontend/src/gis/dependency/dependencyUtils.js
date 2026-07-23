export const shouldDisplayDependencies = (selectedLayers) => {
  if (!Array.isArray(selectedLayers) || selectedLayers.length < 2) {
    return false;
  }

  return true;
};

export const filterEdgesBySelectedLayers = (edges, selectedLayers) => {
  if (!shouldDisplayDependencies(selectedLayers)) {
    return [];
  }

  if (!Array.isArray(edges)) {
    return [];
  }

  const layerSet = new Set(selectedLayers);

  return edges.filter((edge) => {
    if (!edge || !edge.sourceLayer || !edge.targetLayer) {
      return false;
    }

    return layerSet.has(edge.sourceLayer) && layerSet.has(edge.targetLayer);
  });
};

export const filterEdgesByNodeId = (edges, nodeId) => {
  if (!nodeId || !Array.isArray(edges)) {
    return [];
  }

  return edges.filter(
    (edge) =>
      edge &&
      (edge.source?.id === nodeId || edge.target?.id === nodeId)
  );
};

export const getIncomingEdges = (edges, nodeId) => {
  if (!nodeId || !Array.isArray(edges)) {
    return [];
  }

  return edges.filter((edge) => edge && edge.target?.id === nodeId);
};

export const getOutgoingEdges = (edges, nodeId) => {
  if (!nodeId || !Array.isArray(edges)) {
    return [];
  }

  return edges.filter((edge) => edge && edge.source?.id === nodeId);
};
