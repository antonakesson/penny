export interface FeatureDef {
  title: string;
  message: string;
}

// Gated systems that exist in code but stay hidden from the player until
// unlocked (see items with a matching `action` in data/itemActions.ts), so
// the game doesn't dump every system on the player at once.
export const FEATURES = {
  bestiary: {
    title: 'Bestiary Unlocked',
    message: "Not your journal. Not quite empty, either — one page in, then nothing. You start filling in the rest.",
  },
} as const satisfies Record<string, FeatureDef>;

export type FeatureId = keyof typeof FEATURES;
