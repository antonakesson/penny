// Widened successor to monstats.ts. Single registry, single id space — see
// ENCOUNTER_REFACTOR.md. Every encounter def, whatever kind, lives here;
// zones.ts's pool and events.svelte.ts's shouldShowEvent() are shape-blind
// id sources over this same table, so whether an id is one-shot vs.
// repeatable, or zone-pickable vs. event-only, stays a content decision
// (an id simply not listed in a given zone's pool), never a type constraint.

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
  // Beats revealed in order as progress advances (see Discovery.svelte),
  // not one static blurb — an investigation has a duration to spend, so its
  // flavor text can escalate instead of sitting still for the whole hold.
  descriptions?: readonly string[];
}

// Placeholder shape only — real fields (stage, options, cost, outcome) land
// with the Rabid Squirrel follow-up. Exists to prove the sealed union /
// registry / <Encounter/> dispatch handles a non-hp-drain kind end-to-end.
export interface RabbidSquirrelDef {
  kind: 'rabbidSquirrel';
  name: string;
  level: number;
  description?: string;
}

export type EncounterDef = MonsterDef | InvestigationDef | RabbidSquirrelDef;

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
    durationMs: 2_000, // was maxHp: 8 at dps 4
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

  watersnake: { kind: 'monster', name: 'Watersnake', level: 2, maxHp: 4, xpReward: 2, dropTableId: [] },
  fox: { kind: 'monster', name: 'Fox', level: 2, maxHp: 5, xpReward: 2, dropTableId: [] },
  // xpReward was 4 (ratio 0.33) - worse than every commoner monster in the
  // pool despite being the third-rarest by weight. Bumped to fit "rarer is
  // a treat" between Blueberry (rarer, ratio 1.0) and Feral Goat/Fox
  // (commoner, ratio 0.4).
  moose: { kind: 'monster', name: 'Moose', level: 2, maxHp: 12, xpReward: 8, dropTableId: [] },
  blueberry: { kind: 'monster', name: 'Blueberry', level: 2, maxHp: 6, xpReward: 6, dropTableId: [] },
  duckJustADuck: {
    kind: 'monster',
    name: 'Duck. Just a Duck.',
    level: 2,
    maxHp: 2,
    xpReward: 1,
    dropTableId: [],
  },
  deceptiveMoundLookingSolidButWasActuallyWetFeet: {
    kind: 'monster',
    name: 'Deceptive Mound (Looking Solid But Was Actually Wet Feet)',
    level: 2,
    maxHp: 3,
    xpReward: 7,
    dropTableId: [],
  },
  feralGoat: { kind: 'monster', name: 'Feral Goat', level: 2, maxHp: 5, xpReward: 2, dropTableId: [] },
  ruffian: { kind: 'monster', name: 'Ruffian', level: 2, maxHp: 10, xpReward: 4, dropTableId: [] },
  suspiciouslyOrganizedRatKing: {
    kind: 'monster',
    name: 'Suspiciously Organized Rat King',
    level: 2,
    maxHp: 14,
    xpReward: 9,
    dropTableId: [],
  },
  guyWhoDefinitelyOwnsThisNow: {
    kind: 'monster',
    name: 'Guy Who Definitely Owns This Now',
    level: 2,
    maxHp: 6,
    xpReward: 3,
    dropTableId: [],
  },
  theAuditor: { kind: 'monster', name: 'The Auditor', level: 2, maxHp: 9, xpReward: 9, dropTableId: [] },

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
    durationMs: 75_000,
    xpReward: 100,
    dropTableId: ['hastilyAbandonedCampDrops'],
    descriptions: [
      "The embers are still warm. A pot of stew sits half-eaten over the coals. Whoever left didn't mean to — not with a small, very cherished notebook still tucked under the bedroll.",
      'The notebook falls open to its only finished page — a boar, sketched with more care than anything else in this camp. The rest of the pages are still waiting.',
    ],
  },

  // Throwaway placeholder — not listed in any zone pool or event trigger.
  // Only reachable via Dev Tools' spawn selector, to prove the plumbing
  // (registry -> createEncounter() -> <RabbidSquirrelCard/>) end-to-end
  // before the real Recruit Pet stages are built.
  rabbidSquirrel: {
    kind: 'rabbidSquirrel',
    name: 'Rabid Squirrel',
    level: 1,
  },
} as const satisfies Record<string, EncounterDef>;

export type EncounterId = keyof typeof ENCOUNTERS;
