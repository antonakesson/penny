export const MONSTERS = {
  boar: {
    name: 'Boar',
    level: 1,
    entryNo: 1,
    maxHp: 5,
    xpReward: 2,
    dropTableId: 'boarDrops',
  },
} as const;

export type MonsterId = keyof typeof MONSTERS;
