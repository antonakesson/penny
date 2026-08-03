export type StatId = 'damage' | 'petDamage';

export interface Modifier {
  stat: StatId;
  value: number; // flat, additive only
}

export const STAT_LABELS: Record<StatId, string> = {
  damage: 'Damage',
  petDamage: 'Pet Damage',
};
