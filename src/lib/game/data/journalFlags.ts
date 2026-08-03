// Opaque boolean "this has happened" storage - see journalFlags.svelte.ts
// for the bitmask itself. Bit assignments there are fixed once a flag ships
// (not reassigned/reordered), same rule as events.svelte.ts's firedMask, so
// this union only ever grows.
// genieBottleFound (drop-time) and genieWishGranted (use-time) are
// deliberately separate, not one flag - a bottle already sitting unused in
// inventory must still work when finally used, so the loot-substitution
// gate (fires the moment the real bottle first drops) can't be the same
// flag the effect's guardFlag checks (fires once the wish is actually
// spent) - see loot.ts's ITEM_SUBSTITUTIONS and effects.ts's summonGenie.
export type FlagId = 'genieBottleFound' | 'genieWishGranted';

// Same flat id-namespace JOURNAL_ENTRIES uses (a dialog node, an encounter
// id, an item drop id - whatever gets passed to engine.ts's setFlagsFor()),
// one table instead of a hardcoded if-chain per call site. An id with no
// entry here just doesn't flip anything - most ids won't.
export const FLAG_TRIGGERS: Partial<Record<string, FlagId>> = {
  corkedBottle: 'genieBottleFound',
  'genie:item': 'genieWishGranted',
  'genie:granted': 'genieWishGranted',
};
