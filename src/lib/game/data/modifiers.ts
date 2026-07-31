// The "list of IDs" here is a closed union, not a runtime table - a
// Modifier isn't looked up by id like an EFFECTS/EQUIPMENT entry, it's a
// small literal value embedded wherever a source declares its own bonus
// (an item's `passive`, an effect's `grantModifier.modifier`, equipment's
// future `modifiers`). One member on purpose - extend when a second stat
// has a real item/effect to validate it, not speculatively now.
export type StatId = 'damage';

export interface Modifier {
  stat: StatId;
  value: number; // flat, additive only - no percent, no `type` field yet
}

// The one actual table in this file - display labels only, nothing reads
// this to decide behavior.
export const STAT_LABELS: Record<StatId, string> = {
  damage: 'Damage',
};
