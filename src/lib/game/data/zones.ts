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
    // Order is load-bearing - cumulative weight position maps a roll to a
    // habitat band (see pickEncounter below), low-to-high signal.
    // One-shot discoveries (hastilyAbandonedCamp) don't belong here - see
    // state/events.svelte.ts for those instead.
    encounters: [
      { id: 'thornyShrubbery', weight: 6 },
      { id: 'fish', weight: 2 },
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
      { id: 'rabbitHole', weight: 3 },
    ] as { id: EncounterId; weight: number }[],
  },
  // DRAFT - name/description/quote are placeholders, not locked in.
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
  // DRAFT - same caveats as zone2.
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

// Deterministic - same seed and distance always produce the same encounter.
export function pickEncounter(zoneId: ZoneId): EncounterId {
  const zone = ZONES[zoneId];
  return weightedPick(zone.encounters.map((m) => [m.id, m.weight] as const), getSignal());
}
