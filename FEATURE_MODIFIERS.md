# Modifier Registry — Feature Spec (Draft)

Status: **planning, not implemented**.

## Problem

Gear already carries a free-form `stats` dict (`items.js`):

```js
fishingRodOfDesperation: { stats: { yieldMultiplier: 0.1 } }
```

`getEquippedStats` (`stats.js`) sums these into one totals object,
purely generically — it doesn't know what any key means, and nothing
reads the result to affect a calculation yet ("no effects wired to
them yet" per its own comment). That's fine for exactly one gear item
with one stat. It stops being fine once items, talents
(`FEATURE_TALENTS.md`), and buffs are all trying to feed the same
system, for a few concrete reasons surfaced while designing toward
that point:

1. **No validation.** A typo'd key (`fatigeReduction`) or a key nobody
   ever wired a reader for silently does nothing, forever. Every other
   registry in this codebase (`ITEMS`, `ZONES`, `RECIPES`,
   `TREASURE_CLASSES`) is a closed set that something resolves against
   — `stats` is the one place still using bare unvalidated strings.
2. **Some modifiers need a target, not just a magnitude.** "+X to
   talent tree Y" or "+drop chance in zone Z" can't be expressed as a
   flat `{ key: value }` pair without baking the target into the key
   name as a string (`talentBonus_fishing: 5`) — which breaks the
   moment two different sources need the same shape with different
   targets.
3. **Different modifiers combine differently.** Additive percentages
   (`rummageDropChance`), flat integer counts (`netCapacityBonus`),
   boolean overrides (`zoneAccessOverride`), and outright table
   redirects (`treasureClassRedirect`) can't all be reduced by the same
   `totals[key] += value` loop.
4. **Discrete vs. continuous.** Most modifiers apply at the moment an
   action resolves (a craft, a rummage). Some (`hungerDrainRate`, once
   Survival exists — see `FEATURE_ITEM_SINK.md`) need to be read every
   `tick()` instead.
5. **Cross-cutting modifiers need one canonical read site.** A global
   time-scale modifier (hypothetical: "Pocket-Sized Black Hole",
   `timeFastforwardFactor`) has to be read by *every* consumer that
   measures elapsed time — right now that's both `tick()` (`engine.js`)
   and the progress-bar `%` calc (`render.js`), independently computing
   `Date.now() - slot.startedAt`. Two independent readers of the same
   quantity is already a latent bug (visual progress and actual
   resolution can desync); a modifier system makes that non-optional
   to fix, since it's the one thing every duration-based modifier has
   to compose against correctly.

## Goal

A closed registry of modifier ids (so authoring a stat is validated,
not a free string), a record shape that supports multi-param targeting
(not just magnitude), and one reconciliation entrypoint that every
consumer queries instead of reading raw config or interpreting item
stats itself.

## Design

### Record shape, not a flat dict

```js
{ id: 'rummageDropChance', params: { zone: 'reef' }, value: 0.1, source: 'talent:scavenger3' }
{ id: 'fatigueReduction',  params: {},               value: 0.2, source: 'item:fishingRod' }
{ id: 'talentPointBonus',  params: { tree: 'fishing' }, value: 5, source: 'item:luckyCharm' }
```

- `id` — which registered modifier kind this is (validated against
  `MODIFIERS`, see below).
- `params` — whatever addressing that kind needs (a zone id, a talent
  tree, a table name); empty object for modifiers that are truly
  global.
- `value` — the magnitude. Type depends on the modifier's declared op
  (number for add/multiply, boolean for override, a TC id string for
  redirect).
- `source` — provenance only (debug/UI — "this bonus comes from your
  rod"), never read for logic.

### `MODIFIERS` registry — the closed set

One entry per valid `id`, each declaring:

- **combine op**: `add` (sum then apply as %), `multiply`, `flatCount`
  (sum as integer), `override` (boolean, last-write-wins semantics
  TBD), `redirect` (points at a different table/TC id).
- **discrete vs. continuous**: resolved once per action, or read every
  `tick()`.
- **required params shape**, if any (e.g. `zoneAccessOverride` requires
  `{ zone }`).

This is the validation surface. An item/talent/buff can only declare a
modifier whose `id` exists here — same discipline as `ITEMS`/`ZONES`
already enforce for their own keys.

### One module owns it: `modifier.js`, and it speaks in resolved values

`stats.js` (currently just `getEquippedStats`) grows into — or gets
superseded by — a dedicated `modifier.js` that owns the whole registry
and every consumer's entrypoint into it. It's the only code in the
project that knows what `add`/`multiply`/`flatCount`/`override`/
`redirect` mean; `state` stays exactly as dumb as it is today
(equipped ids, eventually talent/buff data) — `modifier.js` interprets
it, state never gets smarter.

The interface matters as much as the registry: consumers must never
receive raw modifier records and combine them locally, only a single
already-reconciled value. Raw records passed around means every call
site needs to know that particular `id`'s combine op — which is the
exact "two places have to agree" failure shape from the elapsed-time
problem above, just relocated from *calculations* to *combine logic*.
So the entrypoint is a resolver, not a query:

```js
resolve(state, id, params, baseValue)
```

`resolve` looks up `id` in `MODIFIERS` to find its op, gathers every
matching record (equipped gear now, talents/buffs/zone effects later),
applies that op against `baseValue`, and returns one plain value —
same shape every time, whatever type that `id` is declared to produce:

```js
const duration  = resolve(state, 'rummageDuration',    {}, GATHER.activeMs);
const canEnter  = resolve(state, 'zoneAccessOverride',  { zone: targetZoneId }, false);
const dropOdds  = resolve(state, 'rummageDropChance',   { zone: currentZoneId }, baseChance);
```

`engine.js`/`render.js` never see a modifier record and never combine
anything themselves — they pass a base value in, get the real one
back. That's the common language: one function signature, for every
one of the ten-plus modifier kinds, regardless of internal op
complexity.

A secondary raw-query function (`getModifiers(state, { id, params })`
→ array) can still exist underneath `resolve` for introspection/UI use
(a tooltip listing "which items are contributing to this number") —
but gameplay logic only ever calls `resolve`, never the raw query
directly. Same orchestrator/specialist split already in place
elsewhere (`travel.js` owns routing math, `modifier.js` owns modifier
math, `engine.js` decides *when* to ask).

Critically: **never store the aggregated result in `state`** (e.g. a
`state.bonuses` field kept in sync on equip/unequip). That reintroduces
a second source of truth that every future trigger (talent respec, a
buff expiring on a timer, entering a zone with an ambient effect) would
have to remember to re-sync — the exact bug class the current
`getEquippedStats` comment already calls out ("derived, not stored").
Stay derived-on-read; memoize later if profiling actually demands it,
using the same signature-check pattern already used in `render.js`'s
`renderInventory`/`renderCraft` (skip recompute unless the relevant
state slice changed) — a perf optimization, not a correctness
requirement, and not worth building preemptively for a dozen records.

### Cross-cutting modifiers need a single canonical calculation function

Any modifier that composes against a quantity read from more than one
place (elapsed time being the sharpest example) needs that quantity
computed by exactly one function that every consumer calls — e.g. a
`getElapsedGameTime(state, slot)` that `tick()` and the progress-bar
calc both go through, rather than each computing
`Date.now() - slot.startedAt` inline. This isn't specific to
modifiers, but a modifier system is what forces the discipline: the
day `timeFastforwardFactor` (or `fatigueReduction`'s effect on
duration) needs applying, every independent inline read site is a spot
it can be forgotten.

## Worked examples (id / scope / op / wrinkle)

| id | scope (params) | op | what it exposes |
|---|---|---|---|
| `rummageDropChance` / `fishDropChance` | per action-table, optional zone | add | needs a scope, not just global |
| `fatigueReduction` | global | add | targets the **cost** side of an action, not the reward side |
| `travelTimeReduction` | global or per-edge | add | cross-cutting into `travel.js`, not gather-only |
| `weatherResistance` | per weather type | add | inert today, load-bearing once dynamic weather exists — define the id now anyway |
| `netCapacityBonus` | global | flatCount | integer, not %; different combine rule than the additive ones |
| `craftBonusYield` | per recipe or global | add (chance) | touches crafting (`recipes.js`), proving the registry isn't gather-specific |
| `hungerDrainRate` | global | multiply | **continuous** — read every `tick()`, not at action-resolve time |
| `zoneAccessOverride` | `{ zone }` required | override (bool) | gates *access*, not a calculation; param is mandatory, not optional |
| `treasureClassRedirect` | `{ from, to }` TC ids | redirect | rewrites *which table gets read*, most exotic op |
| `timeFastforwardFactor` | global | multiply | the cross-cutting-single-read-site case above |
| `autosaveIntervalMs` | global | multiply/override | **meta, not gameplay** — tunes the engine's own save cadence, proving `resolve` isn't gather/travel-scoped |
| `travelCompleteChime` | global | override (bool, OR) | no number to tune at all — gates a **side effect** (play a sound on `slotArrived`), not a calculation; pure QoL/cosmetic |

## Open questions (TBD)

- Combine order when multiple ops target the same `id` (two `add`s and
  one `override` — does override always win regardless of order, or is
  it last-registered-wins)?
- Clamping/bounds strategy for stacked multiplicative modifiers (12
  black holes should not divide-by-zero the tick loop). Needs a cap
  somewhere in reconciliation, not left to each consumer.
- Exact-match vs. hierarchical param matching — does a global
  `rummageDropChance` (no `zone` param) apply everywhere, layered under
  a zone-specific one, or are they mutually exclusive registrations?
- How talents/buffs actually *emit* modifier records once those
  systems exist — `FEATURE_TALENTS.md` is itself blocked on a
  level/XP system, so this registry can be built and validated against
  gear alone first, with talents/buffs as later modifier sources
  slotting into the same query interface.
- **Buffs specifically**: a buff is a modifier record with an added
  `expiresAt`, sourced from a consumed item (`FEATURE_USE_ITEMS.md`,
  itself blocked on this doc) rather than equipped gear. Open: does
  `resolve` filter expired records lazily on every read (simplest,
  consistent with "stay derived, don't store aggregates"), or does
  something need to prune `state` on a timer for records that also
  drive UI (e.g. a "time remaining" display can't wait for the next
  `resolve` call that happens to touch that `id`)?
