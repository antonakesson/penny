import type { EncounterId } from './encounters';

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

export interface SubZoneDef {
  // Stable identity - keys the UI-owned flavor lookup (see
  // components/data/flavor.ts). Never reassigned once shipped, same rule
  // as PoiGroupDef.id above. Description/quote prose lives entirely outside
  // this file - the game-logic layer only needs to know this subzone exists,
  // not what it says about itself.
  id: string;
  name: string;
  // Distance span. The last subzone in a zone stays active indefinitely past
  // it (no travel graph yet - see FEATURE_ZONE_MAP_REWORK.md's Deferred
  // section); length still matters there because it bounds where that
  // subzone's own POIs are allowed to anchor.
  length: number;
  encounters: readonly { id: EncounterId; weight: number }[];
  pois?: readonly PoiGroupDef[];
}

export interface ZoneDef {
  name: string;
  subZones: readonly SubZoneDef[];
}

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    subZones: [
      {
        id: 'treeLine',
        name: 'Tree Line',
        length: 40,
        // Same pool as Deep Woods for now - splitting it by subzone is a
        // follow-up authoring decision, not made here.
        encounters: [
          { id: 'thornyShrubbery', weight: 6 },
          { id: 'fish', weight: 2 },
          { id: 'boar', weight: 10 },
          { id: 'honeybee', weight: 1 },
          { id: 'badger', weight: 15 },
          { id: 'rabbitHole', weight: 3 },
        ] as { id: EncounterId; weight: number }[],
        pois: [
          { id: 'rabbidSquirrel', members: [{ encounter: 'rabbidSquirrel', offset: 0 }] },
          { id: 'occupiedOuthouse', members: [{ encounter: 'occupiedOuthouse', offset: 0 }] },
          { id: 'interruptingCreek', members: [{ encounter: 'interruptingCreek', offset: 0 }] },
        ] as PoiGroupDef[],
      },
      {
        id: 'deepWoods',
        name: 'Deep Woods',
        length: 60,
        encounters: [
          { id: 'thornyShrubbery', weight: 6 },
          { id: 'fish', weight: 2 },
          { id: 'boar', weight: 10 },
          { id: 'honeybee', weight: 1 },
          { id: 'badger', weight: 15 },
          { id: 'rabbitHole', weight: 3 },
        ] as { id: EncounterId; weight: number }[],
        pois: [
          { id: 'hastilyAbandonedCamp', members: [{ encounter: 'hastilyAbandonedCamp', offset: 0 }] },
          // Squirrel recruitment (Tree Line) is always resolved one way or
          // the other by the time this is reachable, since it only anchors
          // past distance 40 - see ENCOUNTER_SUBSTITUTIONS in encounters.ts.
          { id: 'pleasantClearing', members: [{ encounter: 'pleasantClearing', offset: 0 }] },
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
        length: Infinity,
        encounters: [
          { id: 'watersnake', weight: 12 },
          { id: 'deceptiveMoundLookingSolidButWasActuallyWetFeet', weight: 4 },
          { id: 'duckJustADuck', weight: 14 },
          { id: 'moose', weight: 6 },
          { id: 'blueberry', weight: 5 },
          { id: 'feralGoat', weight: 9 },
          { id: 'fox', weight: 9 },
          { id: 'rabbitHole', weight: 3 },
        ] as { id: EncounterId; weight: number }[],
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
        length: Infinity,
        encounters: [
          { id: 'guyWhoDefinitelyOwnsThisNow', weight: 10 },
          { id: 'ruffian', weight: 12 },
          { id: 'suspiciouslyOrganizedRatKing', weight: 3 },
          { id: 'theAuditor', weight: 2 },
          { id: 'rabbitHole', weight: 3 },
        ] as { id: EncounterId; weight: number }[],
      },
    ] as SubZoneDef[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;
