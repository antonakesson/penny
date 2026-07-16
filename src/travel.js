import { ZONE_EDGES } from './zones.js';

function buildAdjacency() {
  const adjacency = {};
  for (const { from, to, timeMs } of ZONE_EDGES) {
    (adjacency[from] ??= []).push({ to, timeMs });
    (adjacency[to] ??= []).push({ to: from, timeMs });
  }
  return adjacency;
}

const ADJACENCY = buildAdjacency();

// Dijkstra over hand-authored edges, weighted by timeMs (the only cost
// travel has — see zones.js). No A*/spatial heuristic — these graphs
// are a handful of zones, not a grid, so a heuristic has nothing to
// shortcut against; plain Dijkstra is the correct tool.
//
// Returns { timeMs, path } for the fastest route, or null if the zones
// aren't connected.
export function findRoute(fromZoneId, toZoneId) {
  if (fromZoneId === toZoneId) return { timeMs: 0, path: [fromZoneId] };

  const bestTime = { [fromZoneId]: 0 };
  const prev = {};
  const visited = new Set();
  const queue = new Set([fromZoneId]);

  while (queue.size) {
    let current = null;
    for (const id of queue) {
      if (current === null || bestTime[id] < bestTime[current]) current = id;
    }
    queue.delete(current);
    if (current === toZoneId) break;
    visited.add(current);

    for (const edge of ADJACENCY[current] ?? []) {
      if (visited.has(edge.to)) continue;
      const time = bestTime[current] + edge.timeMs;
      if (bestTime[edge.to] === undefined || time < bestTime[edge.to]) {
        bestTime[edge.to] = time;
        prev[edge.to] = current;
        queue.add(edge.to);
      }
    }
  }

  if (bestTime[toZoneId] === undefined) return null;

  const path = [toZoneId];
  for (let step = toZoneId; step !== fromZoneId; step = prev[step]) {
    path.unshift(prev[step]);
  }

  return { timeMs: bestTime[toZoneId], path };
}
