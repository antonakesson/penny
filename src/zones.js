// Names/numbers are placeholders — flavor pass comes later (see
// FEATURE_ZONES.md). This is a skeleton to prove out sailing +
// drop-table mechanics, not the full zone list.
// dropTable entries are {id, weight} resolved recursively by engine.js's
// resolveDrop: id is checked against TREASURE_CLASSES first (nested
// table, e.g. 'misc'/'treasure' shared across zones), then falls back
// to a leaf item id. 'nothing' is just an id that resolves to neither —
// no separate drop-chance roll, "no drop" is folded into the weights.
export const ZONES = {
  starter: {
    name: 'Auspicious cove',
    zoneLevel: 1,
    dropTable: [
      { id: 'nothing', weight: 100 },
      { id: 'kelpFragment', weight: 15 }, // zone-exclusive junk
    ],
  },
  reef: {
    name: 'Tetanus Reef',
    zoneLevel: 2,
    dropTable: [
      { id: 'nothing', weight: 90 },
      { id: 'rustyHook', weight: 15 }, // zone-exclusive junk
      { id: 'misc', weight: 5 },
    ],
  },
};

export const DEFAULT_ZONE_ID = 'starter';

// id is injected here (not hand-authored on each zone above) so the
// object key is the single source of truth — can't drift out of sync.
export const ZONE_LIST = Object.entries(ZONES).map(([id, zone]) => ({ id, ...zone }));

// Travel is a graph, not a flat per-destination time: zones only
// connect to their listed neighbors, so reaching a non-adjacent zone
// means routing (and spending time) through whatever's in between —
// findRoute (travel.js) is what solves that. Edges are undirected
// (symmetric both ways) and hand-authored, same spirit as GATHER in
// config.js. timeMs per leg is where stormy-seas/cold-temps flavor
// lives later (just tune the leg) — and eventually what time spent
// traveling draws down (hunger/energy/health), once those exist.
export const ZONE_EDGES = [
  { from: 'starter', to: 'reef', timeMs: 3000 },
];
