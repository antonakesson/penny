import type { EncounterId } from './encounters';

// Self-contained rendering hint, no relation to ENCOUNTERS content. Blank
// (omitted key) beats a forced/inexact match - EncounterCardShell falls
// back to no icon. Also deliberately blank for encounters whose name hides
// what they are (genie, theAuditor, ...) - an icon would spoil the reveal
// the name is withholding.
export const ENCOUNTER_ICONS: Partial<Record<EncounterId, string>> = {
  boar: '🐗',
  honeybee: '🐝',
  badger: '🦡',
  thornyShrubbery: '🌿',
  fish: '🐟',
  watersnake: '🐍',
  fox: '🦊',
  moose: '🫎',
  blueberry: '🫐',
  duckJustADuck: '🦆',
  feralGoat: '🐐',
  suspiciouslyOrganizedRatKing: '🐀',
  rabbitHole: '🕳️',
  hastilyAbandonedCamp: '🏕️',
  rabbidSquirrel: '🐿️',
};
