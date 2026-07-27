import type { MonsterId } from './monstats';
import { weightedPick } from '../util/weighted';
import { clamp01, gaussianJitter } from '../util/random';
import { getElevation } from '../state/map.svelte';
import { SPAWN_JITTER_STDDEV } from '../config';

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees speak in low, continuous tones about the weather, mostly. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
    monsters: [
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
    ] as { id: MonsterId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

export function pickEncounter(zoneId: ZoneId): MonsterId {
  const zone = ZONES[zoneId];
  // Elevation recommends a spot on the weight table; the jitter around it is
  // what keeps a slow-moving curve from reading as "the same monster for 100
  // kills in a row" — see config.ts SPAWN_JITTER_STDDEV.
  const roll = clamp01(getElevation() + gaussianJitter(SPAWN_JITTER_STDDEV));
  return weightedPick(zone.monsters.map((m) => [m.id, m.weight] as const), roll);
}
