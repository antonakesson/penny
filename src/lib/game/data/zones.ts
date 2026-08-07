import type { EncounterId } from './encounters';
import type { ZoneId } from './zoneIds';
export type { ZoneId } from './zoneIds';

// A POI group is placed with one hash roll (see map.ts's resolveGroup /
// noise.ts's idHash) - every member sits at anchor + its own offset, so a
// multi-beat POI (a scene, then its aftermath) stays in relative order and
// proximity under any seed, instead of two independent rolls that could land
// reversed or arbitrarily far apart. A lone POI is just a one-member group.
// A member just names an EncounterId - any conditioned branching (e.g. this
// spot playing out differently once some other flag is set) is a property of
// that encounter itself (see ENCOUNTER_SUBSTITUTIONS in encounters.ts), not
// something a zone/POI author has to know or declare here.
export interface PoiMember {
  encounter: EncounterId;
  offset: number; // distance from the group's anchor; need not be contiguous
}

export interface PoiGroupDef {
  // Stable identity - the hash key (map.ts's resolveGroup). Never reassigned
  // once a seed has shipped with content depending on it - reassigning
  // silently reshuffles where every hash-placed group in the zone lands.
  id: string;
  members: readonly PoiMember[];
  // Absolute distance override - skips the hash roll when set, so this group
  // lands at the same spot for every seed. For a landmark that's meant to be
  // recognized on sight run after run, not one whose placement should vary.
  at?: number;
}

// One line of a subzone's ambient spawn table. `weight` is how much of this
// subzone's traffic this encounter is, full stop - `habitat` only moves it
// around in space, never changes how often it shows up overall (util/habitat.ts
// fits out the difference). So the two are authored independently: pick the
// share you want, then pick where it clusters.
export interface EncounterTableEntry {
  id: EncounterId;
  // Where in the terrain signal (0..1, see state/map.svelte.ts's getSignal)
  // this thing lives. Omit for something that's simply everywhere - it then
  // scatters evenly at its declared weight, no banding.
  habitat?: number;
  // How tolerant it is of signal away from its habitat, in signal units.
  // Omit for the default; lower makes a tighter, more sharply-bounded band.
  spread?: number;
  weight: number;
}

export interface SubZoneDef {
  // Stable identity - keys the UI-owned flavor lookup (see
  // components/data/flavor.ts). Never reassigned once shipped, same rule
  // as PoiGroupDef.id above. Description/quote prose lives entirely outside
  // this file - the game-logic layer only needs to know this subzone exists,
  // not what it says about itself.
  id: string;
  name: string;
  // Absolute distance where this subzone begins - authored the way you'd
  // actually plan a zone out ("Tree Line starts at 0, Deep Woods at 80"),
  // not as a span you'd have to sum backward to know where you are. The
  // last subzone in a zone has no explicit end and stays active
  // indefinitely past its own start (no travel graph past it yet).
  startingDistance: number;
  encounters: readonly EncounterTableEntry[];
  pois?: readonly PoiGroupDef[];
}

export interface ZoneDef {
  name: string;
  subZones: readonly SubZoneDef[];
}

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    // Full-zone layout sketched 2026-08-04: Tree Line -> Deep Woods (name
    // pending - not sold on it, see naming discussion) -> a lake/bandit-camp
    // area -> grasslands -> a boss-buildup stretch holding the crossroad.
    // Only Tree Line and Deep Woods have real content; the last three are
    // structural placeholders (borrowed encounter pools, no POIs of their
    // own yet) so the layout is walkable and testable before any of that
    // content is actually authored.
    subZones: [
      {
        id: 'treeLine',
        name: 'Tree Line',
        startingDistance: 0,
        // Habitats read low-to-high: waterline, scrub, the open middle, the
        // sunny high ground. Overlap is fine and intended - a boar showing up
        // in the shrubs is a boar off its patch, not a table error.
        encounters: [
          { id: 'fish', habitat: 0.05, weight: 3 },
          { id: 'thornyShrubbery', habitat: 0.2, weight: 8 },
          { id: 'boar', habitat: 0.45, weight: 20 },
          { id: 'badger', habitat: 0.6, weight: 15 },
          { id: 'honeybee', habitat: 0.85, weight: 3 },
          { id: 'rabbitHole', weight: 1 },
        ] as EncounterTableEntry[],
        pois: [
          { id: 'rabbidSquirrel', members: [{ encounter: 'rabbidSquirrel', offset: 0 }] },
          { id: 'unpromptedCreek', members: [{ encounter: 'unpromptedCreek', offset: 0 }] },
        ] as PoiGroupDef[],
      },
      {
        id: 'deepWoods',
        // Name not settled - reads too much like a direct translation
        // ("deep forest") rather than the actual idea, which is a
        // liability/jurisdiction boundary (off-piste, out of the Ranger
        // Office's patrol - see Tree Line's own flavor text). Candidates
        // floated: The Unpatrolled, Off-Piste, Unclaimed.
        name: 'Deep Woods',
        startingDistance: 80,
        encounters: [
          { id: 'thornyShrubbery', habitat: 0.2, weight: 4 },
          { id: 'boar', habitat: 0.45, weight: 15 },
          { id: 'badger', habitat: 0.6, weight: 15 },
          { id: 'honeybee', habitat: 0.75, weight: 2 },
          { id: 'feralGoat', habitat: 0.9, weight: 3 },
          { id: 'rabbitHole', weight: 1 },
        ] as EncounterTableEntry[],
        pois: [
          { id: 'hastilyAbandonedCamp', members: [{ encounter: 'hastilyAbandonedCamp', offset: 0 }] },
          // Squirrel recruitment (Tree Line) is always resolved one way or
          // the other by the time this is reachable, since it only anchors
          // past distance 80 - see ENCOUNTER_SUBSTITUTIONS in encounters.ts.
          { id: 'pleasantClearing', members: [{ encounter: 'pleasantClearing', offset: 0 }] },
        ] as PoiGroupDef[],
      },
      // DRAFT - placeholder, not locked in. A lake/bandit-camp area; needs
      // its own humanoid encounters (bandits etc.) and, critically, its own
      // loot table - every drop table in this zone so far is forest-critter
      // themed, nothing humanoid exists yet. Borrows Deep Woods' pool
      // purely so this stretch is walkable in the meantime.
      {
        id: 'lakeCamp',
        name: 'Lake Camp',
        startingDistance: 150,
        encounters: [
          { id: 'thornyShrubbery', habitat: 0.2, weight: 4 },
          { id: 'boar', habitat: 0.45, weight: 15 },
          { id: 'badger', habitat: 0.6, weight: 15 },
          { id: 'honeybee', habitat: 0.75, weight: 2 },
          { id: 'feralGoat', habitat: 0.9, weight: 3 },
          { id: 'rabbitHole', weight: 1 },
        ] as EncounterTableEntry[],
      },
      // DRAFT - placeholder, not locked in. Grasslands over wetlands on
      // purpose: Rainbow Bog (past the crossroad ahead) is already
      // wetland-themed, so this stretch stays dry for contrast rather than
      // reading as more of the same biome before you even cross over.
      {
        id: 'grasslands',
        name: 'Grasslands',
        startingDistance: 200,
        encounters: [
          { id: 'thornyShrubbery', habitat: 0.2, weight: 4 },
          { id: 'boar', habitat: 0.45, weight: 15 },
          { id: 'badger', habitat: 0.6, weight: 15 },
          { id: 'honeybee', habitat: 0.75, weight: 2 },
          { id: 'feralGoat', habitat: 0.9, weight: 3 },
          { id: 'rabbitHole', weight: 1 },
        ] as EncounterTableEntry[],
      },
      // DRAFT - placeholder, not locked in. Meant to hold a short (~10
      // distance) buildup -> miniboss/lore -> boss -> reward sequence before
      // the crossroad; none of that is authored yet, only the crossroad
      // itself has moved here from its old spot in Deep Woods.
      {
        id: 'bossApproach',
        name: 'Boss Approach',
        startingDistance: 250,
        encounters: [
          { id: 'thornyShrubbery', habitat: 0.2, weight: 4 },
          { id: 'boar', habitat: 0.45, weight: 15 },
          { id: 'badger', habitat: 0.6, weight: 15 },
          { id: 'honeybee', habitat: 0.75, weight: 2 },
          { id: 'feralGoat', habitat: 0.9, weight: 3 },
          { id: 'rabbitHole', weight: 1 },
        ] as EncounterTableEntry[],
        pois: [
          // Fixed landmark, not hash-placed - a fork in the road should sit
          // at the same spot every seed. First crossroad in the game; see
          // its own comment in encounters.ts. entryDistance on
          // forkBackToTheWoods (zone2) must stay in sync with this number.
          {
            id: 'forkTowardTheBog',
            members: [{ encounter: 'forkTowardTheBog', offset: 0 }],
            at: 258,
          },
        ] as PoiGroupDef[],
      },
    ] as SubZoneDef[],
  },
  // DRAFT - name is a placeholder, not locked in. Single open-ended subzone:
  // unreachable until the travel graph exists, no subzone/POI structure
  // authored yet.
  zone2: {
    name: 'Rainbow Bog',
    subZones: [
      {
        id: 'rainbowBog',
        name: 'Rainbow Bog',
        startingDistance: 0,
        encounters: [
          { id: 'watersnake', habitat: 0.1, weight: 12 },
          { id: 'duckJustADuck', habitat: 0.2, weight: 14 },
          { id: 'deceptiveMoundLookingSolidButWasActuallyWetFeet', habitat: 0.35, weight: 4 },
          { id: 'moose', habitat: 0.5, weight: 6 },
          { id: 'fox', habitat: 0.65, weight: 9 },
          { id: 'blueberry', habitat: 0.75, weight: 5 },
          { id: 'feralGoat', habitat: 0.9, weight: 9 },
          { id: 'rabbitHole', weight: 3 },
        ] as EncounterTableEntry[],
        pois: [
          // The far end of zone1's forkTowardTheBog - see its comment in
          // encounters.ts. Sits at distance 1 because that's where its
          // partner's entryDistance lands you: the very first step into the
          // Bog is standing back at the same fork.
          {
            id: 'forkBackToTheWoods',
            members: [{ encounter: 'forkBackToTheWoods', offset: 0 }],
            at: 1,
          },
          { id: 'indifferentBog', members: [{ encounter: 'indifferentBog', offset: 0 }] },
        ] as PoiGroupDef[],
      },
    ] as SubZoneDef[],
  },
  // DRAFT - same caveats as zone2.
  zone3: {
    name: 'The Last Ledger',
    subZones: [
      {
        id: 'theLastLedger',
        name: 'The Last Ledger',
        startingDistance: 0,
        encounters: [
          { id: 'suspiciouslyOrganizedRatKing', habitat: 0.15, weight: 3 },
          { id: 'ruffian', habitat: 0.35, weight: 12 },
          { id: 'guyWhoDefinitelyOwnsThisNow', habitat: 0.5, weight: 10 },
          { id: 'theAuditor', habitat: 0.9, weight: 2 },
          { id: 'rabbitHole', weight: 3 },
        ] as EncounterTableEntry[],
      },
    ] as SubZoneDef[],
  },
} as const satisfies Record<ZoneId, ZoneDef>;
