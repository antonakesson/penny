export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const ENCOUNTER_END_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// UI-only bucketing of the raw activity.svelte.ts recency signal into a
// display label. The tracker itself has no concept of "idle" — this constant
// belongs to whichever consumer interprets it, not the signal.
export const PACING_IDLE_MS = 30_000;
