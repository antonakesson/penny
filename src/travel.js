import { ZONE_EDGES } from './zones.js';

function buildAdjacency() {
  const adjacency = {};
  for (const { from, to, cost, timeMs } of ZONE_EDGES) {
    (adjacency[from] ??= []).push({ to, cost, timeMs });
    (adjacency[to] ??= []).push({ to: from, cost, timeMs });
  }
  return adjacency;
}

const ADJACENCY = buildAdjacency();

// Dijkstra over hand-authored edges. No A*/spatial heuristic — these
// graphs are a handful of zones, not a grid, so a heuristic has nothing
// to shortcut against; plain Dijkstra is the correct tool.
//
// Returns { cost, timeMs, path } for the cheapest route, or null if
// the zones aren't connected.
export function findRoute(fromZoneId, toZoneId) {
  if (fromZoneId === toZoneId) return { cost: 0, timeMs: 0, path: [fromZoneId] };

  const bestCost = { [fromZoneId]: 0 };
  const bestTime = { [fromZoneId]: 0 };
  const prev = {};
  const visited = new Set();
  const queue = new Set([fromZoneId]);

  while (queue.size) {
    let current = null;
    for (const id of queue) {
      if (current === null || bestCost[id] < bestCost[current]) current = id;
    }
    queue.delete(current);
    if (current === toZoneId) break;
    visited.add(current);

    for (const edge of ADJACENCY[current] ?? []) {
      if (visited.has(edge.to)) continue;
      const cost = bestCost[current] + edge.cost;
      if (bestCost[edge.to] === undefined || cost < bestCost[edge.to]) {
        bestCost[edge.to] = cost;
        bestTime[edge.to] = bestTime[current] + edge.timeMs;
        prev[edge.to] = current;
        queue.add(edge.to);
      }
    }
  }

  if (bestCost[toZoneId] === undefined) return null;

  const path = [toZoneId];
  for (let step = toZoneId; step !== fromZoneId; step = prev[step]) {
    path.unshift(prev[step]);
  }

  return { cost: bestCost[toZoneId], timeMs: bestTime[toZoneId], path };
}
