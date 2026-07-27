import type { Rarity } from './data/loot';

export interface Monster {
  instanceId: number;
  id: string;
  name: string;
  level: number;
  entryNo: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
  status: 'active' | 'dead';
  diedAt: number | null;
  // Snapshot at spawn time, not derived live from bestiary state — the
  // Bestiary marks this monster discovered almost immediately (well before
  // it's dead), so if this read the live flag instead, the "first time
  // you meet it" label would vanish out from under the player within a
  // tick of appearing.
  isNewDiscovery: boolean;
}

export interface ActionState {
  status: 'idle' | 'active' | 'cooldown';
  startedAt: number | null;
}

export type Inventory = Record<string, number>;

export interface FloatingTextEntry {
  id: number;
  text: string;
  variant: 'damage' | 'loot';
  offset: number;
  rarity?: Rarity;
}
