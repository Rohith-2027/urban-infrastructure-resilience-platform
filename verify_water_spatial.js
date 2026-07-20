const polygon = [
  [77.097095, 13.3329],
  [77.118135, 13.325913],
  [77.12981, 13.3202],
  [77.133769, 13.312004],
  [77.139857, 13.30965],
  [77.147468, 13.313145],
  [77.146949, 13.318241],
  [77.124992, 13.344825],
  [77.115494, 13.344645],
  [77.112026, 13.346659],
  [77.10445, 13.349673],
  [77.092939, 13.345483],
  [77.097095, 13.3329]
];

const waterCandidates = [
  {
    name: "KWSDB Tumakuru Water Supply Scheme",
    type: "Water Treatment Plant",
    lat: 13.2850,
    lon: 77.1167
  },
  {
    name: "Tumakuru Pumped Storage Power Plant",
    type: "Water Pumping Station",
    lat: 13.3750,
    lon: 77.0890
  }
];

function pointInPolygon(point, vs) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const [xi, yi] = vs[i];
    const [xj, yj] = vs[j];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToSegmentMeters(point, segStart, segEnd) {
  const [px, py] = point;
  const [x1, y1] = segStart;
  const [x2, y2] = segEnd;

  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  const latDist = dy * 111320;
  const lonDist = dx * 111320 * Math.cos(y1 * Math.PI / 180);

  return Math.sqrt(latDist * latDist + lonDist * lonDist);
}

function minDistanceToPolygon(point, vs) {
  let minDist = Infinity;
  for (let i = 0; i < vs.length - 1; i++) {
    const d = distanceToSegmentMeters(point, vs[i], vs[i + 1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

console.log("=== WATER INFRASTRUCTURE SPATIAL VERIFICATION ===\n");

waterCandidates.forEach(candidate => {
  const point = [candidate.lon, candidate.lat];
  const isInside = pointInPolygon(point, polygon);
  const minDistance = minDistanceToPolygon(point, polygon);
  const classification = isInside ? 'Inside' : (minDistance <= 5000 ? 'Adjacent' : 'Outside');

  console.log(`Infrastructure: ${candidate.name}`);
  console.log(`Type: ${candidate.type}`);
  console.log(`Location: ${candidate.lat.toFixed(4)}°N, ${candidate.lon.toFixed(4)}°E`);
  console.log(`Classification: ${classification}`);
  console.log(`Distance to boundary: ${Math.round(minDistance)} meters`);
  console.log();
});

console.log("=== RECOMMENDATIONS ===\n");

const recommendations = waterCandidates.map(c => {
  const point = [c.lon, c.lat];
  const isInside = pointInPolygon(point, polygon);
  const minDistance = minDistanceToPolygon(point, polygon);
  const classification = isInside ? 'Inside' : (minDistance <= 5000 ? 'Adjacent' : 'Outside');

  let recommendation = '';
  if (isInside) {
    recommendation = 'INCLUDE';
  } else if (minDistance <= 5000) {
    recommendation = 'INVESTIGATE FURTHER';
  } else {
    recommendation = 'REJECT';
  }

  return {
    name: c.name,
    classification,
    distance: minDistance,
    recommendation
  };
});

recommendations.forEach(item => {
  console.log(`${item.name}: ${item.recommendation}`);
});

console.log("\n=== FINAL VERIFICATION STATUS ===");
const insideCount = recommendations.filter(r => r.classification === 'Inside').length;
const adjacentCount = recommendations.filter(r => r.classification === 'Adjacent').length;

console.log(`Inside the study area: ${insideCount}`);
console.log(`Immediate adjacent (within 5km): ${adjacentCount}`);
console.log(`Suitable for manual dataset: ${insideCount + adjacentCount}`);
console.log(`Total candidates: ${recommendations.length}`);
