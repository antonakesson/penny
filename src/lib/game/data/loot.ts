export const ITEMS = {
  tusk: { name: 'Boar Tusk' },
} as const;

export type ItemId = keyof typeof ITEMS;

const DROP_TABLES: Record<string, ItemId[]> = {
  boarDrops: ['tusk'],
};

export function resolveDropId(dropTableId: string): ItemId | null {
  const pool = DROP_TABLES[dropTableId];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
