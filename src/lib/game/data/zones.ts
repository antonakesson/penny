import type { EncounterId } from './encounters';
import { weightedPick } from '../util/weighted';
import { getSignal } from '../state/map.svelte';

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees are evenly distributed. And strangely, equally tall, as if guided by some cost-benefit analysis of structural integrity versus sunlight yield. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
    quote: {
      text: "If you don't count the people who don't come back, the forest is 100% safe.",
      attribution: 'Cobb Thistlewood, Ranger / Coroner',
    },
    // Ordered low-to-high signal: cumulative weight position is what maps
    // a roll to a habitat band (see pickEncounter below), so array order is
    // load-bearing, not incidental. Thorny Shrubbery and Fish share the wet
    // valley floor - the path runs alongside a lake there - below Boar's
    // foraging ground; Honeybee stays the narrow boar/badger transition
    // marker; Badger holds the high ground. Fish's weight of 2 is carved
    // out of Thorny Shrubbery's (was 8, now 6), not added on top, so the
    // wet-end band's total width is unchanged.
    // hastilyAbandonedCamp is NOT here — one-shot discoveries don't belong
    // in a continuously-resampled terrain table (a threshold generous
    // enough to hit reliably is also generous enough to repeat several
    // kills in a row, since signal dwells above a band edge rather than
    // crossing it once). It's a hardcoded trigger in state/events.svelte.ts
    // instead.
    encounters: [
      { id: 'thornyShrubbery', weight: 6 },
      { id: 'fish', weight: 2 },
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
      { id: 'rabbitHole', weight: 3 },
    ] as { id: EncounterId; weight: number }[],
  },
  // DRAFT — name/description/quote are first-pass placeholders per
  // ACT_1_STORYLINE.md ("not locked in yet"), open to a naming/voice pass.
  // Monster pool is the wetland-themed half of the 11 level-2 stubs;
  // ordered shore-to-shallows-to-drylandwards, same load-bearing-order
  // convention as zone1.
  zone2: {
    name: 'Rainbow Bog',
    description:
      'The name predates the bog. Nobody currently employed by any nearby settlement can explain the rainbow part, and several have stopped trying.',
    quote: {
      text: "You don't sink in the Bog. The Bog just gets taller around you.",
      attribution: 'Widow Pruitt, Innkeeper',
    },
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
  // DRAFT — same caveats as zone2. Bureaucracy/property-dispute theme,
  // built around the four "ownership satire" stubs already on the books
  // (Ruffian, Rat King, Guy Who Definitely Owns This Now, The Auditor).
  // Ordered by seniority: squatter -> enforcer -> organization -> authority.
  zone3: {
    name: 'The Last Ledger',
    description:
      "Somebody kept immaculate records here, right up until they stopped. The books are still open on the desk, mid-entry, as if whoever was writing just meant to step out for a moment.",
    quote: {
      text: 'Possession is nine-tenths of the law. The other tenth is whoever still has the stamp.',
      attribution: 'Marginal note, unsigned ledger',
    },
    encounters: [
      { id: 'guyWhoDefinitelyOwnsThisNow', weight: 10 },
      { id: 'ruffian', weight: 12 },
      { id: 'suspiciouslyOrganizedRatKing', weight: 3 },
      { id: 'theAuditor', weight: 2 },
      { id: 'rabbitHole', weight: 3 },
    ] as { id: EncounterId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

// The roll is the signal itself, straight. Deterministic on purpose: the
// same seed and distance always produce the same encounter, so the full
// run is reproducible from a seed, not just its rough curve.
export function pickEncounter(zoneId: ZoneId): EncounterId {
  const zone = ZONES[zoneId];
  return weightedPick(zone.encounters.map((m) => [m.id, m.weight] as const), getSignal());
}
