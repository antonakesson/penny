export const ACTION = {
  activeMs: 1500,
  cooldownMs: 400,
};

export const ENCOUNTER_END_MS = 500;

export const AUTOSAVE_INTERVAL_MS = 10_000;

// Distance-per-kill scaling before sampling map.svelte.ts's noise signal.
// Two jobs: (1) keeps consecutive kills off exact integer lattice points -
// gradient noise is 0 there by construction, so a raw integer distance
// would sample dead center every time - and (2) sets how many kills it
// takes to cross one noise lattice cell, which is what actually controls
// "streak" length: how long a good/bad terrain patch lasts before the
// signal flips sides, i.e. how long a player rides one trend before the
// next one starts. Simulated across 60 seeds: this value gives a median
// streak of ~12 kills (p90 ~18) between crossings of the signal's own
// median - smaller = longer, slower streaks; larger = choppier, faster
// flips (the playtested 0.15 gave a median of only ~5, too choppy to
// read as a trend). Tune by resimulating streak length against the
// actual signal, not by reasoning about the number alone - same rule as
// zones.ts's encounter weights.
export const DISTANCE_STEP = 0.055;

// How many kills a spawn-freeze effect holds distance still for. Distance
// not advancing means the signal sampled at spawn time doesn't move either,
// so pickEncounter() deterministically hands back the same monster - no
// separate "pinned monster id" needed, this just rides the existing
// determinism.
export const SPAWN_FREEZE_KILLS = 5;

// Naive placeholder curve: +/-20% hp/xp per level away from a monster's
// authored base level. Flat and untuned on purpose - a hand-tailored curve
// (like LEVELS in data/levels.ts) replaces this once scaling is proven out.
export const NAIVE_SCALE_PER_LEVEL = 0.2;

export const INVESTIGATE = {
  // Only source of drain - no ambient decay, since draining HP the player
  // never touched read as unearned. A real damage-per-second rate while
  // the pointer is held down, not a flat per-tick amount - see
  // calculateInvestigationDamage() in engine.ts for why that distinction
  // matters (tick cadence is an implementation detail, not a balance
  // number).
  dps: 4,
};
