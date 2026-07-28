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

// How many kills a spawn-freeze effect holds distance still for. Distance
// not advancing means the signal sampled at spawn time doesn't move either,
// so pickEncounter() deterministically hands back the same monster - no
// separate "pinned monster id" needed, this just rides the existing
// determinism.
export const SPAWN_FREEZE_KILLS = 5;
