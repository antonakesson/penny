// Craft recipes: consume `inputs` (itemId -> qty), produce one of the
// output item. See FEATURE_ITEM_SINK.md for the broader craft-as-sink
// pitch — this is the first (hardcoded) recipe proving that out.
export const RECIPES = {
  fishingRodOfDesperation: {
    inputs: { fivefootpole: 1, rustyHook: 1 },
  },
};
