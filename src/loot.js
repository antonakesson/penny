// The loot system: item data, treasure-class tables, and the D2-style
// recursive resolution that turns a weighted table into a leaf item id.
// Consumers outside this file never touch weights or TC nesting — they
// call resolveDrop(table) and get back an item id or null.

// Trimmed skeleton set to prove out drop resolution — not the full
// item list, that's a separate scope/task.
export const ITEMS = {
  bone: { name: 'Bone' },
  scrapMetal: { name: 'Scrap Metal' },
  tatteredCloth: { name: 'Tattered Cloth' },
  rustyCoin: { name: 'Rusty Coin' },
  crackedGem: { name: 'Cracked Gem', description: 'Cloudy enough to be worthless. Priced accordingly.' },
};

// Visual flavor only — doesn't touch drop rates or any other mechanic,
// just how an item's name/loot text is colored. A sparse override kept
// as its own flat map rather than a field on each ITEMS entry so this
// file's core data doesn't balloon with fields that only matter to
// rendering; item ids missing here read as 'common'.
export const ITEM_RARITY = {
  crackedGem: 'rare',
};

// Diablo 2-style TreasureClass: a named weighted table whose entries
// are resolved recursively (resolveDrop below) — an entry's id is
// checked against this registry first; if it names a TC, resolution
// recurses into that TC's own entries, otherwise it's a leaf item id.
//
// Reusable sub-tables live here so a shared pool (e.g. 'junk') can be
// referenced by id from multiple places — a monster's `drop`, or
// nested inside another TC's entries — without duplicating it.
export const TREASURE_CLASSES = {
  junk: {
    entries: [
      { id: 'scrapMetal', weight: 5 },
      { id: 'tatteredCloth', weight: 5 },
      { id: 'bone', weight: 5 },
      { id: 'rustyCoin', weight: 3 },
    ],
  },
  misc: {
    entries: [
      { id: 'junk', weight: 4 },
      { id: 'crackedGem', weight: 1 },
    ],
  },
};

const MAX_DROP_DEPTH = 8; // guards a cyclic treasure-class reference

// D2-style TreasureClass resolution: roll the weighted table, then if
// the picked id names another treasure class, recurse into it instead
// of returning it. An id matching neither a TC nor an item bottoms out
// as null — shouldn't happen with well-formed data, just a guard.
export function resolveDrop(entries, depth = 0) {
  if (depth > MAX_DROP_DEPTH) return null;
  const picked = pickWeighted(entries);
  if (!picked) return null;
  const nested = TREASURE_CLASSES[picked];
  if (nested) return resolveDrop(nested.entries, depth + 1);
  return ITEMS[picked] ? picked : null;
}

// Resolves a single id straight to a leaf item — the shape a
// monster's `drop` field points at (one TC, D2 monstats.txt-style),
// as opposed to resolveDrop's weighted-list shape (multiple entries
// competing by weight, e.g. a TREASURE_CLASSES sub-table).
export function resolveDropId(id, depth = 0) {
  if (depth > MAX_DROP_DEPTH) return null;
  const nested = TREASURE_CLASSES[id];
  if (nested) return resolveDrop(nested.entries, depth + 1);
  return ITEMS[id] ? id : null;
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}
