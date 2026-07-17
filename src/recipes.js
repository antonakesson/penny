// Craft recipes: consume `inputs` (itemId -> qty), produce one of the
// output item. See FEATURE_ITEM_SINK.md for the broader craft-as-sink
// pitch — this is the first (hardcoded) recipe proving that out.
export const RECIPES = {
  fishingRodOfDesperation: {
    inputs: { fivefootpole: 1, rustyHook: 1 },
  },
  // craftMs claims the self slot (engine.js's craftItem/tick), same as
  // rummaging/sailing does — omitted craftMs (the recipe above) resolves
  // on the next tick, effectively instant.
  kelpGString: {
    inputs: { kelpFragment: 10 },
    craftMs: 15 * 60 * 1000,
  },
};
