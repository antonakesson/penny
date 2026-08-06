export const ENCOUNTER_END_MS = 500;

// How long a newly-rendered choice ignores input (see ui/choiceSettle).
// Long enough to swallow one stray click from an attack rhythm, short
// enough that a player who meant it doesn't notice waiting.
export const CHOICE_SETTLE_MS = 250;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Keeps consecutive kills off integer lattice points (noise is 0 there) and
// sets streak length (~12 kills median). Tune by resimulating, not by feel.
export const DISTANCE_STEP = 0.055;

export const PET = {
  damage: 1,
  activeMs: 300, // quick jab, not the player's 1.5s swing
  recoveryMs: 10_000,
};
