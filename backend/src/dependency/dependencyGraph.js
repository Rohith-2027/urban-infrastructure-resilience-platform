export const createEdge = ({ sourceNodeId, targetNodeId, edgeType, status = "active", weight = 1, metadata = {} } = {}) => ({
  id: null,
  sourceNodeId,
  targetNodeId,
  edgeType,
  status,
  weight,
  metadata,
});

export const createGraph = () => ({
  nodes: [],
  edges: [],
  _edgeCounter: 0,
  nextEdgeId() {
    return `edge-${++this._edgeCounter}`;
  },
});
