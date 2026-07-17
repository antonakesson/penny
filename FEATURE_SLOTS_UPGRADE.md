# Slots Upgrade — Self Slot + Tool Slots (Feature Spec, Draft)

Status: **planning, not implemented**.

## Problem with the current model

`state.slots` (`state.js`) is a flat, homogeneous array — every slot has
the same shape (`status`, `startedAt`, `zoneId`, `targetZoneId`) and
behaves identically. `GATHER.slotCount` (`config.js`) just controls how
many of these interchangeable slots exist. `tick()` (`engine.js`) drives
every slot through the same `active → recovery → idle` cycle and never
auto-reactivates — `idle → active` only ever happens via a manual
`activateSlot()` click.

That accidentally matches the fiction for hand-gathering (you rummage,
it wears you out for a beat, you rummage again) but is wrong once nets
exist: a net should be cast once and left running, not re-clicked every
cycle. And structurally there's no reason today that a save couldn't
have 3, 5, 10 identical slots — nothing distinguishes "the player's own
two hands" (there is only one player) from "gear the player placed and
walked away from" (there can be as many as they've unlocked).

## Goal

Make the slot model reflect the actual fiction: **one shipwrecked
person, doing one direct thing at a time, plus however many passive
tools they've got soaking simultaneously.**

## Design

Split `state.slots` into two kinds with different rules, not one array
with a `kind` flag bolted on — they diverge enough (reactivation
behavior, cardinality, probably UI treatment) that separate state and
separate tick logic each stay simpler than one unified path with
branches everywhere.

### Self slot — exactly one, always

- Represents the player's own attention/hands. Always exists, never
  more than one — there's only one castaway.
- Tool is whatever's equipped for direct action: bare hands by default,
  later the crafted Fishing Rod of Desperation (see
  `FEATURE_ITEM_SINK.md` for the craft angle).
- Never auto-reactivates. `recovery → idle` still happens on its own
  (the cooldown passes), but `idle → active` stays a manual click —
  this is the existing `activateSlot` behavior, unchanged. Matches
  "you rummage, then have to choose to rummage again."
- Can still sail (the player travels with their own boat/raft); that
  part of the existing slot behavior carries over unchanged.

### Tool slots — zero or more, unlocked by progression

- Represents passive gear left running: nets first, possibly
  traps/snares/other reskins later (`flavor.js` already frames the
  engine as swappable for exactly this: "traps, snares, foraging").
- Cast once (manual `activate`, or `sail` to place it in a zone), then
  **auto-loops**: `recovery → active` happens on its own via `tick()`,
  no reclick needed. This is the actual point of a net — leave it,
  travel elsewhere or close the tab, come back to collected loot.
- Count starts at 0 (no nets yet) and grows via whatever unlocks nets —
  that trigger is still undecided (see Open questions).

### Vessel — shared location, not per-slot

- One `vessel: { zoneId, status, targetZoneId, startedAt }` object,
  replacing `zoneId`/`targetZoneId` living on each slot. There's one
  boat — nets don't grow legs and sail off on their own. Self slot and
  tool slots all read the vessel's `zoneId`; only the self slot pilots
  (`sailSlot` moves the vessel, tool slots just come along for the
  ride).
- Resolves the tool-slot travel open question below: it's the same
  trip, not a separate one per net.
- Tiers/upgrades (raft, amenities, `requires`-gated edges) are out of
  scope here — stubbed separately in `FEATURE_VESSEL.md`.

### Rummage table vs. fish table, not resource vs. item

Earlier draft of this doc framed the self-slot split as resource-table
(hands) vs. item-table (rod) — that's dead now that `state.resource`
("Loot") is gone (see `FEATURE_ITEM_SINK.md`'s update note). The
replacement is simpler and doesn't need any currency at all: **hands
and rod are each their own drop table, per zone, and they're allowed to
overlap.**

- Each zone authors two tables instead of one `dropTable` — e.g.
  `rummageTable` and `fishTable`.
- They can share entries. `treasureClasses.js` already exists
  specifically for this: shared sub-tables (`misc`, `treasure`) are
  meant to be referenced by multiple top-level tables at their own
  per-table weights. `rummageTable` and `fishTable` both pointing at
  `misc`, each with a different weight and a different set of
  zone/action-exclusive leaf entries alongside it, is the same pattern
  already used for sharing across *zones* — just reused for sharing
  across *actions* within one zone.
- **Self slot, hands** → rolls the zone's `rummageTable`.
- **Self slot, rod** → rolls the zone's `fishTable`.
- **Tool slot, net** → rolls both (still the payoff for unlocking it —
  see previous section).

Lore-wise this is the actual point: rummaging (beachcombing, digging
through wreckage) and fishing (rod in the water) are different
activities that turn up different stuff, with natural overlap (a
fishhook could turn up either way) rather than one pool gated on/off by
which tool you're holding. It also makes the choice of self-slot tool
a real decision per zone, not just a strictly-better upgrade — a zone
could have a rich `rummageTable` and a thin `fishTable` or vice versa,
so picking hands vs. rod is a "what's this zone actually good for"
question, not just "rod, always, once you have one."

This still lines up with `FEATURE_TALENTS.md`'s Fishing vs. Scavenger
tree split, just retargeted: both trees now modulate item-table rolls
(different tables, different odds/rarity), not one resource roll and
one item roll.

## Implementation shape (sketch, not final)

- `state.js`: replace `slots: []` with `vessel: {...}` (shared
  location, see above), `selfSlot: {...}` (single object, action state
  only — no `zoneId`), and `toolSlots: []` (array, same shape,
  `GATHER`-driven count like today's `slotCount`).
- `engine.js`: `tick()` branches — self slot's `recovery` resolves to
  `idle` (as today); tool slots' `recovery` resolves straight back to
  `active` (auto-recast). `activateSlot`/`sailSlot` need an
  addressing scheme that covers both (e.g. `{kind, index}` or two
  separate functions).
- `render.js`: self slot likely gets distinct treatment (it's always
  exactly one, probably shouldn't render as "Slot 1 of N" the way tool
  slots do).

## Open questions (TBD)

- What actually unlocks the first tool slot (craft a net item?
  zone-gated? something else)? Still undecided — flagged in an earlier
  conversation and deliberately deferred.
- ~~Do tool slots share the self slot's zone-travel graph/costs as-is,
  or do untended nets travel differently~~ — resolved, see "Vessel —
  shared location" above: one shared vessel, no separate net travel.
- Is there ever more than one *type* of tool (net vs. trap vs. snare
  simultaneously, each with their own table-pair), or is "tool slot"
  singular-typed until stated otherwise?
