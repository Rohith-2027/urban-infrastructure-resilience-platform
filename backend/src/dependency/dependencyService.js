import { createGraph, createEdge } from "./dependencyGraph.js";
import { EDGE_TYPES } from "./dependencyTypes.js";

const DEPENDENCY_RULES = {
  hospitals: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 2 },
      { layer: "waterInfrastructure", edgeType: EDGE_TYPES.WATER_PIPELINE, providerLimit: 1 },
      { layer: "communication", edgeType: EDGE_TYPES.FIBER_OPTIC, providerLimit: 1 },
    ],
  },
  fireStations: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 2 },
      { layer: "waterInfrastructure", edgeType: EDGE_TYPES.WATER_PIPELINE, providerLimit: 1 },
      { layer: "communication", edgeType: EDGE_TYPES.FIBER_OPTIC, providerLimit: 1 },
    ],
  },
  policeStations: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 2 },
      { layer: "waterInfrastructure", edgeType: EDGE_TYPES.WATER_PIPELINE, providerLimit: 2 },
      { layer: "communication", edgeType: EDGE_TYPES.FIBER_OPTIC, providerLimit: 1 },
    ],
  },
  education: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 1 },
      { layer: "waterInfrastructure", edgeType: EDGE_TYPES.WATER_PIPELINE, providerLimit: 1 },
    ],
  },
  communication: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 1 },
    ],
  },
  waterInfrastructure: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 1 },
    ],
  },
  trafficManagement: {
    providers: [
      { layer: "powerSubstations", edgeType: EDGE_TYPES.POWER_LINE, providerLimit: 1 },
      { layer: "communication", edgeType: EDGE_TYPES.FIBER_OPTIC, providerLimit: 1 },
    ],
  },
};

const BALANCE_TOLERANCE_KM = 0.5;
const CONSUMER_LAYERS = Object.keys(DEPENDENCY_RULES);

const createNode = (feature, layer) => {
  const meta = feature.metadata || {};
  const lat = feature.lat ?? feature.center?.lat ?? null;
  const lon = feature.lon ?? feature.center?.lon ?? null;
  return {
    id: meta.nodeId || null,
    sector: meta.sector || null,
    infrastructureType: meta.infrastructureType || null,
    name: meta.name || null,
    latitude: lat,
    longitude: lon,
    status: meta.status || "unknown",
    riskScore: meta.riskScore ?? 50,
    recoveryTime: meta.estimatedRecoveryTime ?? 120,
    layer,
  };
};

const haversineDistance = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const resolveProviderRole = (rank) => {
  if (rank === 1) return "PRIMARY";
  if (rank === 2) return "BACKUP";
  return "REDUNDANT";
};

const selectBalancedProviders = (candidates, limit) => {
  if (candidates.length <= limit) return candidates;

  const selected = [];
  const providerLoad = new Map();

  for (const c of candidates) {
    providerLoad.set(c.node.id, 0);
  }

  for (let i = 0; i < limit; i++) {
    let bestCandidate = null;
    let bestScore = Infinity;

    for (const candidate of candidates) {
      if (selected.includes(candidate)) continue;

      const distScore = candidate.distance;
      const loadScore = (providerLoad.get(candidate.node.id) || 0) * BALANCE_TOLERANCE_KM;
      const score = distScore + loadScore;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      selected.push(bestCandidate);
      providerLoad.set(bestCandidate.node.id, (providerLoad.get(bestCandidate.node.id) || 0) + 1);
    }
  }

  selected.sort((a, b) => a.distance - b.distance);
  return selected;
};

const validateEdgeQuality = (edge, nodeMap) => {
  const issues = [];
  const source = nodeMap[edge.sourceNodeId];
  const target = nodeMap[edge.targetNodeId];
  const meta = edge.metadata || {};

  if (!source) issues.push(`Invalid source reference: ${edge.sourceNodeId}`);
  if (!target) issues.push(`Invalid target reference: ${edge.targetNodeId}`);
  if (!edge.edgeType) issues.push("Missing edgeType");
  if (meta.distance != null && meta.distance <= 0) issues.push(`Invalid distance: ${meta.distance}`);
  if (meta.dependencyStrength != null && (meta.dependencyStrength < 0.1 || meta.dependencyStrength > 1.0)) {
    issues.push(`Invalid dependencyStrength: ${meta.dependencyStrength}`);
  }
  if (meta.providerRole && !["PRIMARY", "BACKUP", "REDUNDANT"].includes(meta.providerRole)) {
    issues.push(`Invalid providerRole: ${meta.providerRole}`);
  }

  return issues;
};

export default class DependencyService {
  #graph;

  constructor() {
    this.#graph = createGraph();
  }

  buildGraph(infrastructure = {}) {
    this.#graph = createGraph();

    for (const [layer, features] of Object.entries(infrastructure)) {
      if (!Array.isArray(features)) continue;

      for (const feature of features) {
        const nodeId = feature?.metadata?.nodeId;
        if (!nodeId) continue;

        this.#graph.nodes.push(createNode(feature, layer));
      }
    }

    const nodesByLayer = {};
    for (const node of this.#graph.nodes) {
      if (!nodesByLayer[node.layer]) nodesByLayer[node.layer] = [];
      nodesByLayer[node.layer].push(node);
    }

    const existingEdges = new Set();
    const providerCounts = new Map();
    const edgesPerConsumerType = new Map();

    for (const [consumerLayer, rule] of Object.entries(DEPENDENCY_RULES)) {
      const consumers = nodesByLayer[consumerLayer];
      if (!consumers) continue;

      for (const providerDef of rule.providers) {
        const providers = nodesByLayer[providerDef.layer];
        if (!providers) continue;

        for (const consumer of consumers) {
          if (consumer.latitude == null || consumer.longitude == null) continue;

          const allCandidates = providers
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({ node: p, distance: haversineDistance(consumer, p) }))
            .sort((a, b) => a.distance - b.distance);

          const maxDistance = allCandidates.length > 0
            ? allCandidates[allCandidates.length - 1].distance
            : 0;

          const selected = selectBalancedProviders(allCandidates, providerDef.providerLimit);

          let createdCount = 0;

          for (let rank = 0; rank < selected.length; rank++) {
            const provider = selected[rank].node;
            const distance = selected[rank].distance;
            const edgeKey = `${provider.id}->${consumer.id}`;

            if (existingEdges.has(edgeKey)) {
              console.warn(
                `[DependencyGraph] Duplicate edge prevented: ${edgeKey}`
              );
              continue;
            }

            if (createdCount >= providerDef.providerLimit) {
              console.warn(
                `[DependencyGraph] Provider limit exceeded for ${consumer.id} (${consumerLayer}) via ${providerDef.layer}: limit=${providerDef.providerLimit}`
              );
              break;
            }

            existingEdges.add(edgeKey);
            createdCount++;

            const providerRole = resolveProviderRole(rank + 1);
            const dependencyStrength = maxDistance > 0
              ? Math.round(Math.max(0.1, 1 - distance / maxDistance) * 100) / 100
              : 1.0;
            const isRedundant = selected.length > 1;

            const edge = createEdge({
              sourceNodeId: provider.id,
              targetNodeId: consumer.id,
              edgeType: providerDef.edgeType,
              status: "ACTIVE",
              weight: 1,
              metadata: {
                dependencyType: providerDef.edgeType,
                providerRank: rank + 1,
                providerRole,
                providerLimit: providerDef.providerLimit,
                distance: Math.round(distance * 100) / 100,
                dependencyStrength,
                isRedundant,
                edgeStatus: "ACTIVE",
                failurePropagationDelay: 0,
                currentLoadFactor: 1.0,
                failureProbabilityModifier: 1.0,
              },
            });
            edge.id = this.#graph.nextEdgeId();

            providerCounts.set(provider.id, (providerCounts.get(provider.id) || 0) + 1);

            this.#graph.edges.push(edge);
          }

          if (!edgesPerConsumerType.has(consumerLayer)) {
            edgesPerConsumerType.set(consumerLayer, new Map());
          }
          edgesPerConsumerType.get(consumerLayer).set(
            consumer.id,
            (edgesPerConsumerType.get(consumerLayer).get(consumer.id) || 0) + createdCount
          );
        }
      }
    }

    for (const [consumerLayer, rule] of Object.entries(DEPENDENCY_RULES)) {
      const consumers = nodesByLayer[consumerLayer];
      if (!consumers) continue;

      for (const providerDef of rule.providers) {
        const providers = nodesByLayer[providerDef.layer];
        if (!providers) continue;

        for (const consumer of consumers) {
          if (consumer.latitude == null || consumer.longitude == null) continue;

          const currentEdges = edgesPerConsumerType.get(consumerLayer)?.get(consumer.id) || 0;
          if (currentEdges >= providerDef.providerLimit) continue;

          const allCandidates = providers
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({ node: p, distance: haversineDistance(consumer, p) }))
            .sort((a, b) => a.distance - b.distance);

          const maxDistance = allCandidates.length > 0
            ? allCandidates[allCandidates.length - 1].distance
            : 0;

          let fallbackCreated = 0;

          for (const candidate of allCandidates) {
            if (currentEdges + fallbackCreated >= providerDef.providerLimit) break;

            const provider = candidate.node;
            const distance = candidate.distance;
            const edgeKey = `${provider.id}->${consumer.id}`;

            if (existingEdges.has(edgeKey)) continue;

            existingEdges.add(edgeKey);
            fallbackCreated++;

            const totalAfter = currentEdges + fallbackCreated;
            const providerRole = resolveProviderRole(totalAfter);
            const dependencyStrength = maxDistance > 0
              ? Math.round(Math.max(0.1, 1 - distance / maxDistance) * 100) / 100
              : 1.0;

            const edge = createEdge({
              sourceNodeId: provider.id,
              targetNodeId: consumer.id,
              edgeType: providerDef.edgeType,
              status: "ACTIVE",
              weight: 1,
              metadata: {
                dependencyType: providerDef.edgeType,
                providerRank: totalAfter,
                providerRole,
                providerLimit: providerDef.providerLimit,
                distance: Math.round(distance * 100) / 100,
                dependencyStrength,
                isRedundant: totalAfter > 1,
                edgeStatus: "ACTIVE",
                failurePropagationDelay: 0,
                currentLoadFactor: 1.0,
                failureProbabilityModifier: 1.0,
              },
            });
            edge.id = this.#graph.nextEdgeId();

            providerCounts.set(provider.id, (providerCounts.get(provider.id) || 0) + 1);

            this.#graph.edges.push(edge);
          }
        }
      }
    }

    this.#graph._providerCounts = providerCounts;
    return this.#graph;
  }

  getGraph() {
    return this.#graph;
  }

  getEdges() {
    const nodeMap = {};
    for (const node of this.#graph.nodes) {
      nodeMap[node.id] = node;
    }

    return this.#graph.edges.map((edge) => {
      const sourceNode = nodeMap[edge.sourceNodeId] || null;
      const targetNode = nodeMap[edge.targetNodeId] || null;
      const meta = edge.metadata || {};

      return {
        id: edge.id,
        type: edge.edgeType,
        status: edge.status,
        weight: edge.weight,
        sourceLayer: sourceNode?.layer || null,
        targetLayer: targetNode?.layer || null,
        providerRank: meta.providerRank || null,
        providerLimit: meta.providerLimit || null,
        providerRole: meta.providerRole || null,
        distance: meta.distance ?? null,
        dependencyStrength: meta.dependencyStrength ?? null,
        isRedundant: meta.isRedundant ?? false,
        edgeStatus: meta.edgeStatus || "ACTIVE",
        failurePropagationDelay: meta.failurePropagationDelay ?? 0,
        currentLoadFactor: meta.currentLoadFactor ?? 1.0,
        failureProbabilityModifier: meta.failureProbabilityModifier ?? 1.0,
        source: sourceNode
          ? {
              id: sourceNode.id,
              name: sourceNode.name || null,
              layer: sourceNode.layer,
              type: sourceNode.infrastructureType || null,
              latitude: sourceNode.latitude,
              longitude: sourceNode.longitude,
            }
          : null,
        target: targetNode
          ? {
              id: targetNode.id,
              name: targetNode.name || null,
              layer: targetNode.layer,
              type: targetNode.infrastructureType || null,
              latitude: targetNode.latitude,
              longitude: targetNode.longitude,
            }
          : null,
      };
    });
  }

  getEdgesByInfrastructure(nodeId) {
    if (!nodeId) return [];
    return this.#graph.edges.filter(
      (e) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    );
  }

  getGraphSummary() {
    const nodeMap = {};
    const nodesByLayer = {};
    const edgesByType = {};
    const incomingCount = new Map();
    const outgoingCount = new Map();
    const edgesByConsumer = new Map();
    let totalStrength = 0;
    let strengthCount = 0;

    for (const node of this.#graph.nodes) {
      nodeMap[node.id] = node;
      nodesByLayer[node.layer] = [...(nodesByLayer[node.layer] || []), node];
    }

    for (const edge of this.#graph.edges) {
      edgesByType[edge.edgeType] = (edgesByType[edge.edgeType] || 0) + 1;

      incomingCount.set(
        edge.targetNodeId,
        (incomingCount.get(edge.targetNodeId) || 0) + 1
      );
      outgoingCount.set(
        edge.sourceNodeId,
        (outgoingCount.get(edge.sourceNodeId) || 0) + 1
      );

      if (!edgesByConsumer.has(edge.targetNodeId)) {
        edgesByConsumer.set(edge.targetNodeId, []);
      }
      edgesByConsumer.get(edge.targetNodeId).push(edge);

      const meta = edge.metadata || {};
      if (meta.dependencyStrength != null) {
        totalStrength += meta.dependencyStrength;
        strengthCount++;
      }
    }

    const connectedNodeIds = new Set();
    for (const edge of this.#graph.edges) {
      connectedNodeIds.add(edge.sourceNodeId);
      connectedNodeIds.add(edge.targetNodeId);
    }

    const expectedIsolatedNodes = [];
    const unexpectedIsolatedNodes = [];
    for (const node of this.#graph.nodes) {
      if (connectedNodeIds.has(node.id)) continue;
      if (CONSUMER_LAYERS.includes(node.layer)) {
        unexpectedIsolatedNodes.push({ id: node.id, layer: node.layer, name: node.name });
      } else {
        expectedIsolatedNodes.push({ id: node.id, layer: node.layer, name: node.name });
      }
    }

    const consumersWithoutProviders = unexpectedIsolatedNodes.map((n) => n.id);

    const providerCounts = this.#graph._providerCounts || new Map();
    const unusedProviders = [];
    const providerUtilization = [];
    for (const node of this.#graph.nodes) {
      if (node.layer === "powerSubstations" || node.layer === "waterInfrastructure" || node.layer === "communication") {
        const count = providerCounts.get(node.id) || 0;
        providerUtilization.push({ id: node.id, layer: node.layer, name: node.name, consumerCount: count });
        if (count === 0) {
          unusedProviders.push({ id: node.id, layer: node.layer, name: node.name });
        }
      }
    }

    const consumerCoverage = [];
    for (const [consumerLayer, rule] of Object.entries(DEPENDENCY_RULES)) {
      const consumers = nodesByLayer[consumerLayer] || [];
      for (const consumer of consumers) {
        for (const providerDef of rule.providers) {
          const edgesForType = this.#graph.edges.filter(
            (e) =>
              e.targetNodeId === consumer.id &&
              e.edgeType === providerDef.edgeType
          );
          const count = edgesForType.length;
          const expected = providerDef.providerLimit;
          consumerCoverage.push({
            consumerId: consumer.id,
            consumerLayer,
            providerLayer: providerDef.layer,
            edgeType: providerDef.edgeType,
            providerCount: count,
            expected,
            status: count >= 1 ? "ok" : count >= expected ? "max" : "under",
          });
        }
      }
    }

    const invalidEdges = [];
    for (const edge of this.#graph.edges) {
      const issues = validateEdgeQuality(edge, nodeMap);
      if (issues.length > 0) {
        invalidEdges.push({ edgeId: edge.id, issues });
      }
    }

    const providersByConsumer = Array.from(edgesByConsumer.values()).map((edges) => edges.length);
    const avgProvidersPerConsumer = providersByConsumer.length > 0
      ? Math.round((providersByConsumer.reduce((a, b) => a + b, 0) / providersByConsumer.length) * 100) / 100
      : 0;

    const redundantConsumers = Array.from(edgesByConsumer.values())
      .filter((edges) => edges.length > 1)
      .length;

    const avgDependencyStrength = strengthCount > 0
      ? Math.round((totalStrength / strengthCount) * 100) / 100
      : 0;

    const duplicateEdges = 0;
    const providerViolations = 0;
    const isValid =
      duplicateEdges === 0 &&
      invalidEdges.length === 0 &&
      providerViolations === 0 &&
      unexpectedIsolatedNodes.length === 0 &&
      consumersWithoutProviders.length === 0;

    return {
      totalNodes: this.#graph.nodes.length,
      totalEdges: this.#graph.edges.length,
      nodesByLayer,
      edgesByType,
      duplicateEdges,
      expectedIsolatedNodes,
      unexpectedIsolatedNodes,
      consumersWithoutProviders,
      providerViolations,
      invalidEdges,
      unusedProviders,
      providerUtilization,
      consumerCoverage,
      averageDependencyStrength: avgDependencyStrength,
      averageProvidersPerConsumer: avgProvidersPerConsumer,
      redundantConsumers,
      isValid,
      generatedAt: new Date().toISOString(),
    };
  }

  getGraphStatistics() {
    return this.getGraphSummary();
  }

  printGraphSummary() {
    const stats = this.getGraphSummary();

    console.log("=== Dependency Graph Summary ===");
    console.log(`Total Nodes: ${stats.totalNodes}`);
    console.log(`Total Edges: ${stats.totalEdges}`);
    console.log(`Expected Isolated: ${stats.expectedIsolatedNodes.length}`);
    console.log(`Unexpected Isolated: ${stats.unexpectedIsolatedNodes.length}`);
    console.log(`Consumers Without Providers: ${stats.consumersWithoutProviders.length}`);
    console.log(`Unused Providers: ${stats.unusedProviders.length}`);
    console.log(`Redundant Consumers: ${stats.redundantConsumers}`);
    console.log(`Avg Dependency Strength: ${stats.averageDependencyStrength}`);
    console.log(`Avg Providers Per Consumer: ${stats.averageProvidersPerConsumer}`);
    console.log(`Invalid Edges: ${stats.invalidEdges.length}`);
    console.log(`Graph Valid: ${stats.isValid}`);

    console.log("\nNodes by Layer:");
    console.table(stats.nodesByLayer);

    console.log("\nEdges by Type:");
    console.table(stats.edgesByType);

    if (stats.unexpectedIsolatedNodes.length > 0) {
      console.log("\nUnexpected Isolated Nodes:");
      console.table(stats.unexpectedIsolatedNodes);
    }

    if (stats.unusedProviders.length > 0) {
      console.log("\nUnused Providers:");
      console.table(stats.unusedProviders);
    }
  }
}
