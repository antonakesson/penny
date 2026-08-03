export type StatId = 'damage';

export interface Modifier {
  stat: StatId;
  value: number; // flat, additive only
}

export const STAT_LABELS: Record<StatId, string> = {
  damage: 'Damage',
};
