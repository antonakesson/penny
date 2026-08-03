// Widened successor to monstats.ts. Single registry, single id space — see
// ENCOUNTER_REFACTOR.md. Every encounter def, whatever kind, lives here;
// zones.ts's pool and events.svelte.ts's shouldShowEvent() are shape-blind
// id sources over this same table, so whether an id is one-shot vs.
// repeatable, or zone-pickable vs. event-only, stays a content decision
// (an id simply not listed in a given zone's pool), never a type constraint.
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
  // Beats revealed in order as progress advances (see Discovery.svelte),
  // not one static blurb — an investigation has a duration to spend, so its
  // flavor text can escalate instead of sitting still for the whole hold.
  descriptions?: readonly string[];
}

// dialogRoot points into data/dialog.ts's DIALOGS table — the entry node a
// fresh Social encounter starts its conversation at.
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

  // Zone2/zone3 levels+stats below are a first honest pass, not playtested -
  // hp/xp were linearly remapped from their old (pre-level-removal)
  // placeholder numbers into the zone's real hp band, preserving each
  // monster's original xp/hp ratio (the "rarer is a treat" tuning already
  // baked into those ratios carries over unchanged). Expect to retune once
  // these zones are actually played.
  watersnake: { kind: 'monster', name: 'Watersnake', level: 4, maxHp: 34, xpReward: 17, dropTableId: [] },
  fox: { kind: 'monster', name: 'Fox', level: 5, maxHp: 36, xpReward: 14, dropTableId: [] },
  // xpReward was 4 (ratio 0.33) - worse than every commoner monster in the
  // pool despite being the third-rarest by weight. Bumped to fit "rarer is
  // a treat" between Blueberry (rarer, ratio 1.0) and Feral Goat/Fox
  // (commoner, ratio 0.4).
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
  // Ratio 2.33 carried over as-is (rarest in the pool, weight 4) - lands at
  // 75 xp, well above its zone2 neighbors. That's the "treat" tuning working
  // as designed, but it's a bigger absolute jump than it was pre-rescale -
  // worth a second look once this zone is actually played.
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
  // Tied for top level with Rat King, not above it - both are the zone's
  // "serious" encounters (organization + authority, top two seniority
  // rungs), even though Rat King's raw hp edges it out numerically.
  theAuditor: { kind: 'monster', name: 'The Auditor', level: 8, maxHp: 51, xpReward: 51, dropTableId: [] },

  rabbitHole: {
    kind: 'investigation',
    name: 'Rabbit Hole',
    durationMs: 5_000,
    xpReward: 4,
    dropTableId: ['letterDrops'],
  },

  // Stubbed down from a fuller 75s/two-beat writeup - that version leaned on
  // Bestiary-specific lore (a notebook's "one finished page") that doesn't
  // fit the Journal model it's been replaced by. Cheap placeholder for now;
  // revisit once the Journal's own voice/shape is settled.
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
} as const satisfies Record<string, EncounterDef>;

export type EncounterId = keyof typeof ENCOUNTERS;
