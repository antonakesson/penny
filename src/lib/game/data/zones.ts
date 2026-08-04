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
  name: string;
  description?: string;
  quote?: { text: string; attribution: string };
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
        name: 'Tree Line',
        description:
          'The trees are evenly distributed. And strangely, equally tall, as if guided by some cost-benefit analysis of structural integrity versus sunlight yield. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
        quote: {
          text: "If you don't count the people who don't come back, the forest is 100% safe.",
          attribution: 'Cobb Thistlewood, Ranger / Coroner',
        },
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
        ] as PoiGroupDef[],
      },
      {
        // DRAFT - flavor text not written yet.
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
  // DRAFT - name/description/quote are placeholders, not locked in. Single
  // open-ended subzone: unreachable until the travel graph exists, no
  // subzone/POI structure authored yet.
  zone2: {
    name: 'Rainbow Bog',
    subZones: [
      {
        name: 'Rainbow Bog',
        description:
          'The name predates the bog. Nobody currently employed by any nearby settlement can explain the rainbow part, and several have stopped trying.',
        quote: {
          text: "You don't sink in the Bog. The Bog just gets taller around you.",
          attribution: 'Widow Pruitt, Innkeeper',
        },
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
        name: 'The Last Ledger',
        description:
          "Somebody kept immaculate records here, right up until they stopped. The books are still open on the desk, mid-entry, as if whoever was writing just meant to step out for a moment.",
        quote: {
          text: 'Possession is nine-tenths of the law. The other tenth is whoever still has the stamp.',
          attribution: 'Marginal note, unsigned ledger',
        },
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
