# Equipment System — Plan

## Why now, and why not more

One real item exists so far (Knotted Twine Ring, +10% attack/recovery speed).
That's not enough data points to design stacking rules, modifier types, or a
UI for a system that could hold five different kinds of bonuses. So this
plan builds the minimum shape that:

- Doesn't need a rewrite when a second ring, a weapon, or a flat +damage
  item shows up.
- Doesn't invent rules (stacking order, set bonuses, additive-vs-percent
  resolution) that have zero current examples to validate against.

Explicitly deferred until a second concrete case forces the decision:
multiple modifier types (flat vs percent) resolving together, set bonuses,
more than one ring slot, weapon/helm/armor actually having any items.

## Slots

```ts
export type EquipmentSlot = 'weapon' | 'helm' | 'armor' | 'ring';
```

Four slots, one item each. Only `ring` has any content today — the other
three exist in the type so the data model doesn't need to change shape when
the first helm/weapon/armor item is authored, but they stay empty until
then. No multi-ring, no dual-wield — add a second slot of the same kind
only when a second concurrently-equippable item of that kind actually
exists.

## Data model (`data/loot.ts`)

`ItemDef` grows two optional fields, both absent on ordinary loot:

```ts
export type StatId = 'damage' | 'actionSpeed' | 'recoverySpeed';

export interface Modifier {
  stat: StatId;
  value: number; // percent delta, e.g. 0.1 = +10%. See "Modifier math" below.
}

export type ItemDef = {
  name: string;
  rarity: Rarity;
  flavor: string;
  action?: ItemActionId;
  slot?: EquipmentSlot;
  modifiers?: readonly Modifier[];
};
```

The ring's definition becomes:

```ts
knottedTwineRing: {
  name: 'Knotted Twine Ring',
  rarity: 'common',
  flavor: 'Why would anyone ever make a ring out of string?',
  action: 'equipRing',
  slot: 'ring',
  modifiers: [
    { stat: 'actionSpeed', value: 0.1 },
    { stat: 'recoverySpeed', value: 0.1 },
  ],
},
```

The bonus values live on the item, not as a named constant in config.ts
(the `RING_SPEED_BONUS` constant added earlier gets removed/folded in
here) — with N equippable items each carrying their own numbers, a
per-item config constant doesn't scale, and the item definition is the
one place that should own its own stats.

`equipRing` in `data/itemActions.ts` becomes a generic `equip` action
(`consumes: false`) — the switch case in engine.ts reads the item's `slot`
off its `ItemDef` rather than branching on the specific item id, so it
already works for the next equippable item without a new case.

## State (`state/equipment.svelte.ts`)

Single-writer slice, same shape as every other state module:

```ts
let equipped = $state<Record<EquipmentSlot, ItemId | null>>({
  weapon: null,
  helm: null,
  armor: null,
  ring: null,
});

export function getEquipped(slot: EquipmentSlot): ItemId | null { ... }

// Equips itemId into its own slot (read from ITEMS[itemId].slot),
// replacing whatever was there. Clicking the currently-equipped item
// again unequips it (sets that slot back to null) - same click-to-use
// tile, no separate unequip UI needed.
export function toggleEquip(itemId: ItemId) { ... }

export function getActiveModifiers(): Modifier[] {
  return Object.values(equipped)
    .filter((id): id is ItemId => id !== null)
    .flatMap((id) => ITEMS[id].modifiers ?? []);
}

export function serializeEquipment(): Record<EquipmentSlot, ItemId | null> { ... }
export function hydrateEquipment(value: Record<EquipmentSlot, ItemId | null>) { ... }
```

Persisted via save.ts, same tier as inventory/unlockedFeatures — equipping
is a meaningful choice, not session-scoped state like `action` or
`spawnFreeze`.

## engine.ts — parallel derived stats

`calculateDamage()` already exists as the pattern: pure function, reads
other slices, no state of its own. `getAttackSpeedMs()` /
`getRecoverySpeedMs()` follow the identical shape instead of a single
`isRingEquipped()` boolean check:

```ts
function sumModifier(stat: StatId): number {
  return getActiveModifiers()
    .filter((m) => m.stat === stat)
    .reduce((total, m) => total + m.value, 0);
}

export function calculateDamage(): number {
  return getLevel(); // + sumModifier('damage') once a damage item exists
}

export function getAttackSpeedMs(): number {
  return ACTION.activeMs * (1 - sumModifier('actionSpeed'));
}

export function getRecoverySpeedMs(): number {
  return ACTION.cooldownMs * (1 - sumModifier('recoverySpeed'));
}
```

`tick()` swaps its `ACTION.activeMs`/`ACTION.cooldownMs` checks for these.
`AttackMeter.svelte` currently reads `ACTION.activeMs`/`cooldownMs`
directly from config — it needs to switch to these two functions (via the
game.ts facade) so the visible bar timing matches the actual resolve
timing once a ring is equipped.

`calculateDamage()` is left alone for now — no item currently modifies
damage, so wiring `sumModifier('damage')` in has nothing to validate
against yet. Add it when the first damage-modifying item is authored.

## Modifier math

All modifiers are percent deltas applied the same way `RING_SPEED_BONUS`
was going to work: `base * (1 - totalPercent)` for "faster" stats. This is
an approximation (a true "10% faster" would divide, not multiply-by-0.9),
but it's the simplest option and the one already implied by the ring's
flavor. Flat/additive modifiers (a hypothetical "+2 damage" item) aren't
supported by this shape — cross that bridge with a `type: 'flat' | 'percent'`
field on `Modifier` when an item actually needs it, not speculatively now.

## UI

- `ItemTile.svelte`: show an "Equipped" marker when
  `item.slot && getEquipped(item.slot) === id`.
- `Character.svelte`: list the four slots (empty ones read "—" or similar)
  and the resulting active modifiers as a small buff summary — this is
  already the pane that owns Level/XP/Damage, so it's the natural home for
  "what's currently equipped and what it's doing."
- `ItemTooltip.svelte`: `modifiers` is data, not player-facing text on its
  own — the tooltip currently only prints the item's `action` description
  (generic, e.g. "Equip to ring slot"), which says nothing about the
  actual numbers. Add a small `STAT_LABELS: Record<StatId, string>` (e.g.
  `actionSpeed` → "Attack Speed") and render one line per modifier, "+10%
  Attack Speed" style, whenever `item.modifiers` is present — same spot an
  equipped-item's buff summary on the Character pane would reuse.

## Build order

1. `EquipmentSlot`, `Modifier`, `ItemDef` fields, `equip` item action.
2. `state/equipment.svelte.ts` + save.ts wiring.
3. `getActiveModifiers()` / `sumModifier()` + `getAttackSpeedMs()` /
   `getRecoverySpeedMs()` in engine.ts, `tick()` switched over.
4. `AttackMeter.svelte` switched from static `ACTION` to the two derived
   getters.
5. Ring item updated to carry `slot`/`modifiers`, `RING_SPEED_BONUS`
   constant removed from config.ts.
6. UI: equipped marker on `ItemTile`, slot/buff summary on `Character`.
