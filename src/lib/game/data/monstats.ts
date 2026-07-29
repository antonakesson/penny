// Only 'investigate' varies behavior today (passive HP drain instead of
// swing-to-hit) - a hardcoded branch per action, not a pluggable-behavior
// registry. Add a third kind only once a second concrete case shows what
// actually needs to vary.
export type EncounterAction = 'attack' | 'investigate';

export interface MonsterDef {
  name: string;
  level: number;
  entryNo: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
  description?: string;
  action?: EncounterAction;
}

export const MONSTERS = {
  boar: {
    name: 'Boar',
    level: 1,
    entryNo: 1,
    maxHp: 5,
    xpReward: 2,
    dropTableId: ['boarDrops'],
  },
  honeybee: {
    name: 'Honeybee',
    level: 1,
    entryNo: 2,
    maxHp: 2,
    xpReward: 8,
    dropTableId: ['honeybeeDrops'],
  },
  badger: {
    name: 'Badger',
    level: 1,
    entryNo: 3,
    maxHp: 3,
    xpReward: 1,
    dropTableId: ['badgerDrops'],
  },
  thornyShrubbery: {
    name: 'Thorny Shrubbery',
    level: 1,
    entryNo: 4,
    maxHp: 8,
    xpReward: 3,
    dropTableId: ['shrubberyDrops'],
    action: 'investigate',
  },

  watersnake: { name: 'Watersnake', level: 2, entryNo: 5, maxHp: 4, xpReward: 2, dropTableId: [] },
  fox: { name: 'Fox', level: 2, entryNo: 6, maxHp: 5, xpReward: 2, dropTableId: [] },
  moose: { name: 'Moose', level: 2, entryNo: 7, maxHp: 12, xpReward: 4, dropTableId: [] },
  blueberry: { name: 'Blueberry', level: 2, entryNo: 8, maxHp: 6, xpReward: 6, dropTableId: [] },
  duckJustADuck: { name: 'Duck. Just a Duck.', level: 2, entryNo: 9, maxHp: 2, xpReward: 1, dropTableId: [] },
  deceptiveMoundLookingSolidButWasActuallyWetFeet: {
    name: 'Deceptive Mound (Looking Solid But Was Actually Wet Feet)',
    level: 2,
    entryNo: 10,
    maxHp: 3,
    xpReward: 7,
    dropTableId: [],
  },
  feralGoat: { name: 'Feral Goat', level: 2, entryNo: 11, maxHp: 5, xpReward: 2, dropTableId: [] },
  ruffian: { name: 'Ruffian', level: 2, entryNo: 12, maxHp: 10, xpReward: 4, dropTableId: [] },
  suspiciouslyOrganizedRatKing: {
    name: 'Suspiciously Organized Rat King',
    level: 2,
    entryNo: 13,
    maxHp: 14,
    xpReward: 9,
    dropTableId: [],
  },
  guyWhoDefinitelyOwnsThisNow: {
    name: 'Guy Who Definitely Owns This Now',
    level: 2,
    entryNo: 14,
    maxHp: 6,
    xpReward: 3,
    dropTableId: [],
  },
  theAuditor: { name: 'The Auditor', level: 2, entryNo: 15, maxHp: 9, xpReward: 9, dropTableId: [] },

  hastilyAbandonedCamp: {
    name: 'Hastily Abandoned Camp',
    level: 1,
    entryNo: 16,
    maxHp: 300,
    xpReward: 100,
    dropTableId: ['hastilyAbandonedCampDrops'],
    action: 'investigate',
    description:
      "The embers are still warm. A pot of stew sits half-eaten over the coals. Whoever left didn't mean to — not with a small, very cherished notebook still tucked under the bedroll.",
  },
} as const satisfies Record<string, MonsterDef>;

export type MonsterId = keyof typeof MONSTERS;
