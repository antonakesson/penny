// Single registry, single id space - every encounter def, whatever kind,
// lives here. Whether an id is zone-pickable vs. event-only is a content
// decision (listed in a zone's pool or not), not a type constraint.
import type { DialogNodeId } from './dialog';

export interface MonsterDef {
  kind: 'monster';
  name: string;
  level: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
  description?: string;
}

export interface InvestigationDef {
  kind: 'investigation';
  name: string;
  durationMs: number; // authored honestly, not a guessed maxHp
  xpReward: number;
  dropTableId: readonly string[];
  // Beats revealed in order as progress advances (see Discovery.svelte).
  descriptions?: readonly string[];
}

export interface SocialDef {
  kind: 'social';
  name: string;
  level: number;
  dialogRoot: DialogNodeId;
  description?: string;
}

export type EncounterDef = MonsterDef | InvestigationDef | SocialDef;

export const ENCOUNTERS = {
  boar: {
    kind: 'monster',
    name: 'Boar',
    level: 1,
    maxHp: 5,
    xpReward: 2,
    dropTableId: ['boarDrops'],
  },
  honeybee: {
    kind: 'monster',
    name: 'Honeybee',
    level: 1,
    maxHp: 2,
    xpReward: 8,
    dropTableId: ['honeybeeDrops'],
  },
  badger: {
    kind: 'monster',
    name: 'Badger',
    level: 1,
    maxHp: 3,
    xpReward: 1,
    dropTableId: ['badgerDrops'],
  },
  thornyShrubbery: {
    kind: 'investigation',
    name: 'Thorny Shrubbery',
    durationMs: 2_000,
    xpReward: 3,
    dropTableId: ['shrubberyDrops'],
  },
  fish: {
    kind: 'monster',
    name: 'Fish',
    level: 1,
    maxHp: 3,
    xpReward: 5,
    dropTableId: ['fishDrops'],
    description: 'Not the first of its kind to try to walk on land. The others, notably, did not go back.',
  },

  // Zone2/zone3 stats below are a first pass, not playtested.
  watersnake: { kind: 'monster', name: 'Watersnake', level: 4, maxHp: 34, xpReward: 17, dropTableId: [] },
  fox: { kind: 'monster', name: 'Fox', level: 5, maxHp: 36, xpReward: 14, dropTableId: [] },
  moose: { kind: 'monster', name: 'Moose', level: 6, maxHp: 50, xpReward: 33, dropTableId: [] },
  blueberry: { kind: 'monster', name: 'Blueberry', level: 5, maxHp: 38, xpReward: 38, dropTableId: [] },
  duckJustADuck: {
    kind: 'monster',
    name: 'Duck. Just a Duck.',
    level: 4,
    maxHp: 30,
    xpReward: 15,
    dropTableId: [],
  },
  deceptiveMoundLookingSolidButWasActuallyWetFeet: {
    kind: 'monster',
    name: 'Deceptive Mound (Looking Solid But Was Actually Wet Feet)',
    level: 4,
    maxHp: 32,
    xpReward: 75,
    dropTableId: [],
  },
  feralGoat: { kind: 'monster', name: 'Feral Goat', level: 5, maxHp: 36, xpReward: 14, dropTableId: [] },
  ruffian: { kind: 'monster', name: 'Ruffian', level: 7, maxHp: 55, xpReward: 22, dropTableId: [] },
  suspiciouslyOrganizedRatKing: {
    kind: 'monster',
    name: 'Suspiciously Organized Rat King',
    level: 8,
    maxHp: 70,
    xpReward: 45,
    dropTableId: [],
  },
  guyWhoDefinitelyOwnsThisNow: {
    kind: 'monster',
    name: 'Guy Who Definitely Owns This Now',
    level: 6,
    maxHp: 40,
    xpReward: 20,
    dropTableId: [],
  },
  theAuditor: { kind: 'monster', name: 'The Auditor', level: 8, maxHp: 51, xpReward: 51, dropTableId: [] },

  rabbitHole: {
    kind: 'investigation',
    name: 'Rabbit Hole',
    durationMs: 5_000,
    xpReward: 4,
    dropTableId: ['letterDrops'],
  },

  hastilyAbandonedCamp: {
    kind: 'investigation',
    name: 'Hastily Abandoned Camp',
    durationMs: 10_000,
    xpReward: 15,
    dropTableId: ['hastilyAbandonedCampDrops'],
    descriptions: ['The embers are still warm. Whoever left here didn’t mean to.'],
  },

  rabbidSquirrel: {
    kind: 'social',
    name: 'Friendly (but possibly rabid) Squirrel',
    level: 1,
    dialogRoot: 'squirrel:greet',
  },

  genie: {
    kind: 'social',
    name: 'Something in the Bottle',
    level: 1,
    dialogRoot: 'genie:root',
  },

  occupiedOuthouse: {
    kind: 'social',
    name: 'Occupied Outhouse',
    level: 1,
    dialogRoot: 'outhouse:root',
  },
} as const satisfies Record<string, EncounterDef>;

export type EncounterId = keyof typeof ENCOUNTERS;
