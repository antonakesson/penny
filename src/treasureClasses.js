// Diablo 2-style TreasureClass: a named weighted table whose entries
// are resolved recursively (engine.js's resolveDrop) — an entry's id
// is checked against this registry first; if it names a TC, resolution
// recurses into that TC's own entries, otherwise it's a leaf item id.
// 'nothing' is a plain id with no special handling beyond that (no
// match in TREASURE_CLASSES or ITEMS resolves to no drop).
//
// Shared/reusable sub-tables live here so multiple zones can reference
// the same pool (e.g. several zones rolling into 'treasure') at their
// own top-level odds — see each zone's own dropTable in zones.js for
// that per-zone weighting. Zone-exclusive junk stays inline in the
// zone's own dropTable instead of getting a single-entry TC here.
export const TREASURE_CLASSES = {
  misc: {
    entries: [
      { id: 'bluefinScale', weight: 3 },
      { id: 'waterloggedLedger', weight: 1 },
    ],
  },
  treasure: {
    entries: [
      { id: 'frostbittenScrap', weight: 3 },
      { id: 'tidalPearl', weight: 1 },
      { id: 'fivefootpole', weight: 1 },
    ],
  },
};
