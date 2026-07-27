import type { MonsterId } from './monstats';
import { weightedPick } from '../util/weighted';

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
  return weightedPick(zone.monsters.map((m) => [m.id, m.weight] as const));
}
