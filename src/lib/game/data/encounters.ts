// Single registry, single id space - every encounter def, whatever kind,
// lives here. Whether an id is zone-pickable vs. event-only is a content
// decision (listed in a zone's pool or not), not a type constraint.
import type { DialogNodeId } from './dialog';
import type { Condition } from './condition';
import type { ZoneId } from './zoneIds';
import { evaluateCondition } from '../condition';
import { assertNever } from '../util/assertNever';
import {
  MONSTER_ENTITIES,
  INVESTIGATION_ENTITIES,
  type MonsterEntityId,
  type InvestigationEntityId,
} from './entities';

// name/level/hp/xp/drops live on the entity (data/entities.ts), not here -
// this is dispatch (what to show, how to resolve) plus a pointer to what's
// actually spawning, not a copy of what that thing is.
export interface MonsterDef {
  kind: 'monster';
  entity: MonsterEntityId;
}

export interface InvestigationDef {
  kind: 'investigation';
  entity: InvestigationEntityId;
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
  boar: { kind: 'monster', entity: 'boar' },
  honeybee: { kind: 'monster', entity: 'honeybee' },
  badger: { kind: 'monster', entity: 'badger' },
  thornyShrubbery: { kind: 'investigation', entity: 'thornyShrubbery' },
  fish: { kind: 'monster', entity: 'fish' },

  watersnake: { kind: 'monster', entity: 'watersnake' },
  fox: { kind: 'monster', entity: 'fox' },
  moose: { kind: 'monster', entity: 'moose' },
  blueberry: { kind: 'monster', entity: 'blueberry' },
  duckJustADuck: { kind: 'monster', entity: 'duckJustADuck' },
  deceptiveMoundLookingSolidButWasActuallyWetFeet: {
    kind: 'monster',
    entity: 'deceptiveMoundLookingSolidButWasActuallyWetFeet',
  },
  feralGoat: { kind: 'monster', entity: 'feralGoat' },
  deer: { kind: 'monster', entity: 'deer' },
  antelope: { kind: 'monster', entity: 'antelope' },
  carrionBird: { kind: 'monster', entity: 'carrionBird' },
  ruffian: { kind: 'monster', entity: 'ruffian' },
  suspiciouslyOrganizedRatKing: { kind: 'monster', entity: 'suspiciouslyOrganizedRatKing' },
  guyWhoDefinitelyOwnsThisNow: { kind: 'monster', entity: 'guyWhoDefinitelyOwnsThisNow' },
  theAuditor: { kind: 'monster', entity: 'theAuditor' },

  rabbitHole: { kind: 'investigation', entity: 'rabbitHole' },

  hastilyAbandonedCamp: { kind: 'investigation', entity: 'hastilyAbandonedCamp' },

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

  unpromptedCreek: {
    kind: 'social',
    name: 'Unprompted Creek',
    level: 1,
    dialogRoot: 'unpromptedCreek:root',
  },

  indifferentBog: {
    kind: 'social',
    name: 'Indifferent Bog',
    level: 1,
    dialogRoot: 'indifferentBog:root',
  },

  cliffsEdge: {
    kind: 'social',
    name: "Cliff's Edge",
    level: 1,
    dialogRoot: 'cliffsEdge:root',
  },

  // id names it for our own bookkeeping only - LORE.md's "only ever hinted,
  // never explained" rule means the player-facing `name` below can't. The
  // open question this answers (LORE.md: "Did Gwendolyn's cat ever turn
  // up?") stays unstated in-fiction; the id is the only place that connects
  // the dots, and ids aren't shown to players (see forkTowardTheBog above
  // for the same move).
  gwendolynsCat: {
    kind: 'social',
    name: 'A Cat',
    level: 1,
    dialogRoot: 'gwendolynsCat:root',
  },

  // Default/declared id - what's placed in zones.ts. Same coordinate, same
  // entity, same mechanics, either way - only the flavor (components/data/
  // flavor.ts's ENCOUNTER_FLAVOR) and the squirrel's mood differ. See
  // ENCOUNTER_SUBSTITUTIONS below.
  pleasantClearing: { kind: 'investigation', entity: 'pleasantClearing' },
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

  // Substituted in once `pet` is unlocked - never placed directly. Same
  // entity as pleasantClearing above (was two hand-duplicated defs before
  // the entity split; now the shared 'pleasantClearing' entity is the only
  // copy of those numbers, and only ENCOUNTER_FLAVOR needs to know these
  // are two different ids).
  pleasantClearingRecruited: { kind: 'investigation', entity: 'pleasantClearing' },
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

// For callers that only have a bare EncounterId and need a display name
// without already knowing (at the type level) which kind it resolves to -
// e.g. DevTools' spawn dropdown. Anywhere that already branches on `kind`
// (state/encounter.svelte.ts's create*() functions) should look its entity
// up directly instead of going through this.
export function getEncounterName(id: EncounterId): string {
  const def = ENCOUNTERS[id];
  switch (def.kind) {
    case 'monster':
      return MONSTER_ENTITIES[def.entity].name;
    case 'investigation':
      return INVESTIGATION_ENTITIES[def.entity].name;
    case 'social':
    case 'crossroad':
      return def.name;
    default:
      return assertNever(def);
  }
}
