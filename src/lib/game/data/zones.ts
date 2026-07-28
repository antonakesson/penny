import type { MonsterId } from './monstats';
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
    // load-bearing, not incidental. Thorny Shrubbery holds the wet valley
    // floor below Boar's foraging ground; Honeybee stays the narrow
    // boar/badger transition marker; Badger holds the high ground.
    // hastilyAbandonedCamp is NOT here — one-shot discoveries don't belong
    // in a continuously-resampled terrain table (a threshold generous
    // enough to hit reliably is also generous enough to repeat several
    // kills in a row, since signal dwells above a band edge rather than
    // crossing it once). It's a hardcoded trigger in state/events.svelte.ts
    // instead.
    monsters: [
      { id: 'thornyShrubbery', weight: 8 },
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
    ] as { id: MonsterId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

// The roll is the signal itself, straight. Deterministic on purpose: the
// same seed and distance always produce the same encounter, so the full
// run is reproducible from a seed, not just its rough curve.
export function pickEncounter(zoneId: ZoneId): MonsterId {
  const zone = ZONES[zoneId];
  return weightedPick(zone.monsters.map((m) => [m.id, m.weight] as const), getSignal());
}
