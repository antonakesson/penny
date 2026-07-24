import type { Rarity } from './data/loot';
import type { EventId } from './data/events';

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
}

export interface ActionState {
  status: 'idle' | 'active' | 'cooldown';
  startedAt: number | null;
}

export type Encounter =
  | { kind: 'monster'; monster: Monster }
  | { kind: 'treasure'; id: EventId }
  | { kind: 'recruit'; id: EventId };

export type Inventory = Record<string, number>;

export interface FloatingTextEntry {
  id: number;
  text: string;
  variant: 'damage' | 'loot';
  offset: number;
  rarity?: Rarity;
}
