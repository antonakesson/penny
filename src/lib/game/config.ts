export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const ENCOUNTER_END_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Keeps consecutive kills off integer lattice points (noise is 0 there) and
// sets streak length (~12 kills median). Tune by resimulating, not by feel.
export const DISTANCE_STEP = 0.055;

export const INVESTIGATE = {
  // No ambient decay - only drains while held. A rate (dps), not a flat
  // per-tick amount.
  dps: 4,
};

export const PET = {
  damage: 1,
  activeMs: 300, // quick jab, not the player's 1.5s swing
  recoveryMs: 10_000,
};
