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
}

export interface ActionState {
  status: 'idle' | 'active' | 'cooldown';
  startedAt: number | null;
}

export type EventOutcome =
  | { type: 'loot'; xpReward: number; dropTableId: readonly string[] }
  | { type: 'recruit'; mercenaryId: string };

export interface GameEvent {
  instanceId: number;
  id: string;
  name: string;
  entryNo: number;
  tapsRequired: number;
  tapsRemaining: number;
  outcome: EventOutcome;
  status: 'active' | 'resolved';
  resolvedAt: number | null;
}

export type Encounter = { type: 'monster'; monster: Monster } | { type: 'event'; event: GameEvent };

export type Inventory = Record<string, number>;

export interface FloatingTextEntry {
  id: number;
  text: string;
  variant: 'damage' | 'loot';
  offset: number;
  rarity?: Rarity;
}
