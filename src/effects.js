// Effect registry: named, referenced by id from items.js (onUseEffect,
// eventually passiveEffect) — same closed-registry pattern as zones.js
// and treasureClasses.js, so an id typo fails loud instead of silently
// doing nothing.
//
// Flavor-only for now: an entry is just a name + message, no modifier
// attached. Once FEATURE_MODIFIERS.md lands, an entry can grow a
// `modifier: { id, params, value }` (or `expiresAt` for timed ones)
// alongside its message without changing how items reference it — the
// id an item points at doesn't change meaning, only what it resolves to.
export const EFFECTS = {
  tetanus: { name: 'Tetanus', message: 'You may have tetanus.' },
  chafing: { name: 'Chafing', message: 'Uncomfortable chafing.' },
};
