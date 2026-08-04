// Single registry, single id space - every encounter def, whatever kind,
// lives here. Whether an id is zone-pickable vs. event-only is a content
// decision (listed in a zone's pool or not), not a type constraint.
import type { DialogNodeId } from './dialog';
import type { Condition } from './condition';
import type { ZoneId } from './zoneIds';
import { evaluateCondition } from '../condition';

export interface MonsterDef {
  kind: 'monster';
  name: string;
  level: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

export interface InvestigationDef {
  kind: 'investigation';
  name: string;
  durationMs: number; // authored honestly, not a guessed maxHp
  xpReward: number;
  dropTableId: readonly string[];
}

export interface SocialDef {
  kind: 'social';
  name: string;
  level: number;
  dialogRoot: DialogNodeId;
}

// A branch to another zone's own distance track (see state/map.svelte.ts) -
// not a dialog choice. `when`, same shape/semantics as DialogChoice's, hides
// a branch entirely (no index, no keybind) rather than rendering it
// disabled - e.g. a branch that only opens once some item/flag is in hand.
export interface CrossroadBranch {
  label: string;
  destination: ZoneId;
  // Required, not defaulted to 0 - a road connects two specific points, not
  // "the start of the other zone". The reciprocal crossroad on the other
  // end (see zones.ts) hardcodes its own entryDistance back to wherever
  // this one sits, the same way two ends of a real road agree on where
  // they meet.
  entryDistance: number;
  when?: Condition;
}

// Distinct from SocialDef on purpose - a crossroad reads as a fork in the
// road, not a conversation that happens to offer a fork. No dialogRoot, no
// character, no lines: just a name and the branches out of it. The "stay on
// this path" option is never authored here - CrossroadCard always renders it
// alongside whatever branches are declared, same way a POI's zone-switch is
// itself a property of resolveCrossroadChoice(), not of this data.
export interface CrossroadDef {
  kind: 'crossroad';
  name: string;
  branches: readonly CrossroadBranch[];
}

export type EncounterDef = MonsterDef | InvestigationDef | SocialDef | CrossroadDef;

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

  interruptingCreek: {
    kind: 'social',
    name: 'Unprompted Creek',
    level: 1,
    dialogRoot: 'interruptingCreek:root',
  },

  // Default/declared id - what's placed in zones.ts. Same coordinate, same
  // name, same mechanics, either way - only the flavor (components/data/
  // flavor.ts's ENCOUNTER_FLAVOR) and the squirrel's mood differ. See
  // ENCOUNTER_SUBSTITUTIONS below.
  pleasantClearing: {
    kind: 'investigation',
    name: 'Pleasant Clearing',
    durationMs: 3_000,
    xpReward: 5,
    dropTableId: [],
  },
  // First crossroad in the game. Paired with forkBackToTheWoods below -
  // together they're one road, viewed from each end: this one lands you on
  // that one (zone2 distance 1), which is itself a crossroad back here.
  forkTowardTheBog: {
    kind: 'crossroad',
    name: 'The Bog Trail',
    branches: [{ label: 'Follow the trail into Rainbow Bog', destination: 'zone2', entryDistance: 1 }],
  },

  // The other end of forkTowardTheBog's road - lands back at the exact
  // distance that one sits at (zone1 bossApproach, 258), not zone1's start.
  forkBackToTheWoods: {
    kind: 'crossroad',
    name: 'The Woods Trail',
    branches: [{ label: 'Follow the trail back to Whispering Woods', destination: 'zone1', entryDistance: 258 }],
  },

  // Substituted in once `pet` is unlocked - never placed directly.
  pleasantClearingRecruited: {
    kind: 'investigation',
    name: 'Pleasant Clearing',
    durationMs: 3_000,
    xpReward: 5,
    dropTableId: [],
  },
} as const satisfies Record<string, EncounterDef>;

export type EncounterId = keyof typeof ENCOUNTERS;

// An encounter id that silently resolves to a different encounter once
// `when` is met - same shape as loot.ts's ITEM_SUBSTITUTIONS. Whatever
// placed this id (a zone's ambient pool, a POI group) doesn't need to know
// this exists; it's a property of the encounter, resolved fresh every time
// the id is looked up, not a revisit mechanic.
export const ENCOUNTER_SUBSTITUTIONS: Partial<Record<EncounterId, { when: Condition; fallback: EncounterId }>> = {
  pleasantClearing: { when: { kind: 'hasFeature', feature: 'pet' }, fallback: 'pleasantClearingRecruited' },
};

export function substituteEncounter(id: EncounterId): EncounterId {
  const sub = ENCOUNTER_SUBSTITUTIONS[id];
  return sub && evaluateCondition(sub.when) ? sub.fallback : id;
}
