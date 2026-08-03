// genieBottleFound (drop-time) and genieWishGranted (use-time) are separate
// flags - a bottle sitting unused in inventory must still work once used.
// soiledPants and breakingAndEnteringAndPooping are mutually exclusive
// outcomes of the same encounter (occupiedOuthouse) - exactly one ever
// gets set, never both.
export type FlagId =
  | 'genieBottleFound'
  | 'genieWishGranted'
  | 'soiledPants'
  | 'breakingAndEnteringAndPooping';

// One table instead of a hardcoded if-chain per call site. An id with no
// entry here just doesn't flip anything.
export const FLAG_TRIGGERS: Partial<Record<string, FlagId>> = {
  corkedBottle: 'genieBottleFound',
  'genie:item': 'genieWishGranted',
  'genie:granted': 'genieWishGranted',
  'outhouse:accident': 'soiledPants',
  'outhouse:enter': 'breakingAndEnteringAndPooping',
};
