import type { MonsterId } from './monstats';

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees speak in low, continuous tones about the weather, mostly. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose, and then hunger.',
    monsters: [
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
    ] as { id: MonsterId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

export function pickMonsterId(zoneId: ZoneId): MonsterId {
  const monsters = ZONES[zoneId].monsters;
  const totalWeight = monsters.reduce((sum, m) => sum + m.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const m of monsters) {
    if (roll < m.weight) return m.id;
    roll -= m.weight;
  }
  return monsters[monsters.length - 1].id;
}
