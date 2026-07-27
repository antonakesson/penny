export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const ENCOUNTER_END_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Distance-per-kill scaling before sampling map.svelte.ts's elevation noise.
// Gradient noise is 0 at integer lattice points by construction, so a raw
// integer distance would sample dead center every time — this step keeps
// consecutive kills landing at fractional, non-aligned noise coordinates.
export const DISTANCE_STEP = 0.15;

// Stddev of the true-random jitter applied around the elevation curve when
// rolling an encounter (see zones.ts pickEncounter) — elevation recommends a
// spot on the zone's weight table, this spreads each individual roll around
// it so a slow-moving curve doesn't read as "the same monster for 100 kills."
export const SPAWN_JITTER_STDDEV = 0.2;

// UI-only bucketing of the raw activity.svelte.ts recency signal into a
// display label. The tracker itself has no concept of "idle" — this constant
// belongs to whichever consumer interprets it, not the signal.
export const PACING_IDLE_MS = 30_000;
