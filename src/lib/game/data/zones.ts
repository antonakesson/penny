import type { MonsterId } from './monstats';
import { weightedPick } from '../util/weighted';
import { getElevation } from '../state/map.svelte';

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees speak in low, continuous tones about the weather, mostly. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
    // Ordered low-to-high elevation: cumulative weight position is what maps
    // a roll to a habitat band (see pickEncounter below), so array order is
    // load-bearing, not incidental. Thorny Shrubbery holds the wet valley
    // floor below Boar's foraging ground; Honeybee stays the narrow
    // boar/badger transition marker; Badger holds the high ground.
    monsters: [
      { id: 'thornyShrubbery', weight: 8 },
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
    ] as { id: MonsterId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

// No jitter — the roll is elevation itself, straight. Deterministic on
// purpose: the same seed and distance always produce the same encounter, so
// the full run is reproducible from a seed, not just its rough curve.
export function pickEncounter(zoneId: ZoneId): MonsterId {
  const zone = ZONES[zoneId];
  return weightedPick(zone.monsters.map((m) => [m.id, m.weight] as const), getElevation());
}
