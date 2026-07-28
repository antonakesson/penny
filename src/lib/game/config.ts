export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const ENCOUNTER_END_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Distance-per-kill scaling before sampling map.svelte.ts's noise signal.
// Gradient noise is 0 at integer lattice points by construction, so a raw
// integer distance would sample dead center every time — this step keeps
// consecutive kills landing at fractional, non-aligned noise coordinates.
export const DISTANCE_STEP = 0.15;
