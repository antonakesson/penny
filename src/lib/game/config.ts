export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const MONSTER_DEATH_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Cap on how much away-time offline progress will simulate, so a save
// opened after months away doesn't spin the catch-up loop unbounded.
export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;
