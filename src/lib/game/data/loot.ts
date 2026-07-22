export const ITEMS = {
  tusk: { name: 'Boar Tusk' },
  honeycomb: { name: 'Honeycomb' },
  badgerClaw: { name: 'Badger Claw' },
} as const;

export type ItemId = keyof typeof ITEMS;

type DropPool = Record<string, number>;

// Keys are either an ItemId (leaf drop), 'nothing' (no-drop weight), or the
// name of another pool below to recurse into — same shape as D2's TreasureClassEx.
const TREASURE: Record<string, DropPool> = {
  boarDrops: { tusk: 1 },
  honeybeeDrops: { honeycomb: 1 },
  badgerDrops: { badgerClaw: 1 },
};

const MAX_TREASURE_DEPTH = 5;

function isItemId(key: string): key is ItemId {
  return key in ITEMS;
}

function weightedPick(pool: DropPool): string {
  const entries = Object.entries(pool);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * totalWeight;
  for (const [key, weight] of entries) {
    if (roll < weight) return key;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}

function resolveOne(poolId: string): ItemId | null {
  let currentId = poolId;
  for (let depth = 0; depth < MAX_TREASURE_DEPTH; depth++) {
    const pool = TREASURE[currentId];
    if (!pool) return null;
    const key = weightedPick(pool);
    if (key === 'nothing') return null;
    if (isItemId(key)) return key;
    currentId = key;
  }
  return null;
}

// One independent roll per pool id — a monster with the same pool listed
// twice gets two separate chances, not a guaranteed pair.
export function resolveDropIds(dropTableIds: readonly string[]): ItemId[] {
  const drops: ItemId[] = [];
  for (const poolId of dropTableIds) {
    const dropId = resolveOne(poolId);
    if (dropId) drops.push(dropId);
  }
  return drops;
}
