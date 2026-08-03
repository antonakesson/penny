export interface FeatureDef {
  title: string;
  message: string;
}

// Gated systems that exist in code but stay hidden from the player until
// unlocked (see items with a matching `action` in data/effects.ts), so
// the game doesn't dump every system on the player at once.
export const FEATURES = {
  journal: {
    title: 'Journal Unlocked',
    message: 'Not quite empty. One page in, then nothing. You start filling in the rest.',
  },
  pet: {
    title: 'Pet Unlocked',
    message: 'It followed you back. Whether that was your idea or its own is still unclear.',
  },
} as const satisfies Record<string, FeatureDef>;

export type FeatureId = keyof typeof FEATURES;
