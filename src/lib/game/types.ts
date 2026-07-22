export interface Monster {
  id: string;
  name: string;
  level: number;
  entryNo: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: string;
}

export interface ActionState {
  status: 'idle' | 'active';
  startedAt: number | null;
}

export type Inventory = Record<string, number>;
