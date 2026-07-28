export interface FeatureDef {
  title: string;
  message: string;
}

// Gated systems that exist in code but stay hidden from the player until
// earned — distinct from panes.svelte.ts's PLANNED_PANES, which teases
// systems that don't exist yet with a disabled button. A feature here is
// fully built; it's just not revealed until unlocked (see items with a
// matching `action` in data/itemActions.ts), so the game doesn't dump every
// system on the player at once.
export const FEATURES = {
  bestiary: {
    title: 'Bestiary Unlocked',
    message: "The journal isn't yours, but the empty pages are begging to be filled. You start a bestiary.",
  },
} as const satisfies Record<string, FeatureDef>;

export type FeatureId = keyof typeof FEATURES;
