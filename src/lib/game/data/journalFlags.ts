// genieBottleFound (drop-time) and genieWishGranted (use-time) are separate
// flags - a bottle sitting unused in inventory must still work once used.
export type FlagId = 'genieBottleFound' | 'genieWishGranted' | 'lingered' | 'broarSlain';

// One table instead of a hardcoded if-chain per call site. An id with no
// entry here just doesn't flip anything.
export const FLAG_TRIGGERS: Partial<Record<string, FlagId>> = {
  corkedBottle: 'genieBottleFound',
  'genie:item': 'genieWishGranted',
  'genie:lore': 'genieWishGranted',
  'genie:granted': 'genieWishGranted',
  // Unforked path (linger always leads to lingered, always leads to jump) -
  // set the instant the choice is made rather than waiting for the beat to
  // finish playing out. See effects.ts's grantJumpXp for the one thing that
  // currently reads this back.
  'unpromptedCreek:linger': 'lingered',
  // Set the instant the kill resolves (combatEngine.ts's journal.encounterCompleted)
  // - read by ENCOUNTER_SUBSTITUTIONS in encounters.ts to permanently swap
  // the Tree Line POI over to broarAftermath from then on.
  broar: 'broarSlain',
};
