export const MONSTERS = {
  boar: {
    name: 'Boar',
    level: 1,
    entryNo: 1,
    maxHp: 5,
    xpReward: 2,
    dropTableId: ['boarDrops'],
  },
  honeybee: {
    name: 'Honeybee',
    level: 1,
    entryNo: 2,
    maxHp: 2,
    xpReward: 1,
    dropTableId: ['honeybeeDrops'],
  },
  badger: {
    name: 'Badger',
    level: 1,
    entryNo: 3,
    maxHp: 3,
    xpReward: 1,
    dropTableId: ['badgerDrops'],
  },
} as const;

export type MonsterId = keyof typeof MONSTERS;
