// The bestiary layer - what a monster or investigation actually IS (name,
// stats, drops), independent of which POI/encounter slot spawns it. Mirrors
// data/npc.ts's NPCS: an id-referenceable identity table that encounters.ts
// points at instead of duplicating inline, so the same creature can back
// more than one encounter entry (see pleasantClearing/pleasantClearingRecruited
// in encounters.ts, which do exactly that) without hand-duplicating its stats.
//
// Two separate registries, not one tagged union like EncounterDef - a
// monster's and an investigation's stat shapes don't overlap (hp/level vs.
// durationMs), and nothing ever looks one up without already knowing which
// kind it needs (the encounter's own `kind` tag tells the caller that first).

export interface MonsterEntityDef {
  name: string;
  level: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

export const MONSTER_ENTITIES = {
  boar: { name: 'Boar', level: 1, maxHp: 5, xpReward: 2, dropTableId: ['boarDrops'] },
  honeybee: { name: 'Honeybee', level: 1, maxHp: 2, xpReward: 8, dropTableId: ['honeybeeDrops'] },
  badger: { name: 'Badger', level: 1, maxHp: 3, xpReward: 1, dropTableId: ['badgerDrops'] },
  fish: { name: 'Fish', level: 1, maxHp: 3, xpReward: 5, dropTableId: ['fishDrops'] },

  // Zone2/zone3 stats below are a first pass, not playtested.
  watersnake: { name: 'Watersnake', level: 4, maxHp: 34, xpReward: 17, dropTableId: [] },
  fox: { name: 'Fox', level: 5, maxHp: 36, xpReward: 14, dropTableId: [] },
  moose: { name: 'Moose', level: 6, maxHp: 50, xpReward: 33, dropTableId: [] },
  blueberry: { name: 'Blueberry', level: 5, maxHp: 38, xpReward: 38, dropTableId: [] },
  duckJustADuck: { name: 'Duck. Just a Duck.', level: 4, maxHp: 30, xpReward: 15, dropTableId: [] },
  deceptiveMoundLookingSolidButWasActuallyWetFeet: {
    name: 'Deceptive Mound (Looking Solid But Was Actually Wet Feet)',
    level: 4,
    maxHp: 32,
    xpReward: 75,
    dropTableId: [],
  },
  feralGoat: { name: 'Feral Goat', level: 5, maxHp: 36, xpReward: 14, dropTableId: [] },

  // Grasslands' own fauna (zones.ts) - first pass, not playtested, same
  // caveat as the zone2/zone3 block above.
  deer: { name: 'Deer', level: 3, maxHp: 18, xpReward: 8, dropTableId: [] },
  antelope: { name: 'Antelope', level: 4, maxHp: 24, xpReward: 11, dropTableId: [] },
  carrionBird: { name: 'Carrion Bird', level: 3, maxHp: 14, xpReward: 7, dropTableId: [] },

  ruffian: { name: 'Ruffian', level: 7, maxHp: 55, xpReward: 22, dropTableId: [] },
  suspiciouslyOrganizedRatKing: {
    name: 'Suspiciously Organized Rat King',
    level: 8,
    maxHp: 70,
    xpReward: 45,
    dropTableId: [],
  },
  guyWhoDefinitelyOwnsThisNow: {
    name: 'Guy Who Definitely Owns This Now',
    level: 6,
    maxHp: 40,
    xpReward: 20,
    dropTableId: [],
  },
  theAuditor: { name: 'The Auditor', level: 8, maxHp: 51, xpReward: 51, dropTableId: [] },
} as const satisfies Record<string, MonsterEntityDef>;

export type MonsterEntityId = keyof typeof MONSTER_ENTITIES;

export interface InvestigationEntityDef {
  name: string;
  durationMs: number; // authored honestly, not a guessed maxHp
  xpReward: number;
  dropTableId: readonly string[];
}

export const INVESTIGATION_ENTITIES = {
  thornyShrubbery: { name: 'Thorny Shrubbery', durationMs: 2_000, xpReward: 3, dropTableId: ['shrubberyDrops'] },
  rabbitHole: { name: 'Rabbit Hole', durationMs: 5_000, xpReward: 4, dropTableId: ['letterDrops'] },
  hastilyAbandonedCamp: {
    name: 'Hastily Abandoned Camp',
    durationMs: 10_000,
    xpReward: 15,
    dropTableId: ['hastilyAbandonedCampDrops'],
  },
  // Shared by both pleasantClearing and pleasantClearingRecruited in
  // encounters.ts - same thing either way per ENCOUNTER_SUBSTITUTIONS'
  // comment there, only the flavor differs. Used to be two hand-duplicated
  // MonsterDef-shaped entries; this is the entity split paying for itself
  // immediately instead of hypothetically.
  pleasantClearing: { name: 'Pleasant Clearing', durationMs: 3_000, xpReward: 5, dropTableId: [] },
} as const satisfies Record<string, InvestigationEntityDef>;

export type InvestigationEntityId = keyof typeof INVESTIGATION_ENTITIES;
