// Names/numbers are placeholders — flavor pass comes later (see
// FEATURE_ZONES.md). This is a trimmed skeleton (4 zones) to prove out
// sailing + drop-table mechanics, not the full 14-zone draft list.
// dropTable entries are {id, weight} resolved recursively by engine.js's
// resolveDrop: id is checked against TREASURE_CLASSES first (nested
// table, e.g. 'misc'/'treasure' shared across zones), then falls back
// to a leaf item id. 'nothing' is just an id that resolves to neither —
// no separate drop-chance roll, "no drop" is folded into the weights.
export const ZONES = {
  zone1: {
    id: 'zone1',
    name: 'Zone 1',
    zoneLevel: 1,
    dropTable: [
      { id: 'nothing', weight: 100 },
      { id: 'kelpFragment', weight: 15 }, // zone-exclusive junk
    ],
  },
  zone2: {
    id: 'zone2',
    name: 'Zone 2',
    zoneLevel: 2,
    dropTable: [
      { id: 'nothing', weight: 90 },
      { id: 'rustyHook', weight: 15 }, // zone-exclusive junk
      { id: 'misc', weight: 5 },
    ],
  },
  zone3: {
    id: 'zone3',
    name: 'Zone 3',
    zoneLevel: 3,
    dropTable: [
      { id: 'nothing', weight: 75 },
      { id: 'misc', weight: 20 },
      { id: 'treasure', weight: 5 },
    ],
  },
  zone4: {
    id: 'zone4',
    name: 'Zone 4',
    zoneLevel: 4,
    dropTable: [
      { id: 'nothing', weight: 60 },
      { id: 'misc', weight: 20 },
      { id: 'treasure', weight: 20 },
    ],
  },
};

export const DEFAULT_ZONE_ID = 'zone1';

export const ZONE_LIST = Object.values(ZONES);

// Travel is a graph, not a per-destination flat cost: zones only connect
// to their listed neighbors, so reaching a non-adjacent zone means
// routing (and paying) through whatever's in between — same as having
// to stop at an outpost before pushing on to the deep arctic. Edges are
// undirected (symmetric cost/time both ways) and hand-authored, same
// spirit as GATHER in config.js. cost/timeMs per leg is where
// stormy-seas/cold-temps flavor lives later (just tune the leg).
//
// Linear chain (1-2-3-4) on purpose for this skeleton, so zone1->zone4
// has to prove out multi-hop routing, not just direct point-to-point.
export const ZONE_EDGES = [
  { from: 'zone1', to: 'zone2', cost: 15, timeMs: 3000 },
  { from: 'zone2', to: 'zone3', cost: 20, timeMs: 4000 },
  { from: 'zone3', to: 'zone4', cost: 30, timeMs: 6000 },
];
