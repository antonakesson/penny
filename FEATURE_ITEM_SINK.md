# Item Sinks — Feature Spec (Draft)

Status: **planning, not implemented**. Companion to the zones/drops
work (see git history — `FEATURE_ZONES.md` is gone now that it's
built). That was the supply side (zones, drop tables, gear). This is
the demand side: right now everything in `state.inventory` just
accumulates. Nothing consumes it — equipping the one gear item isn't a
sink, the item stays owned.

**Update:** `state.resource` ("Loot") was removed — it was a
click-test currency that never gained a second purpose beyond gating
travel cost, and travel is free now. The Vendor outlet below assumed
that currency already existed for free; if Vendor gets picked up later
it needs its own currency (or to sell for items/barter instead).

## Goal

Give materials (non-gear items) a reason to be farmed for, specific to
*which* material, not just "more loot." Outlets below aren't mutually
exclusive — this is about picking what to build now vs. later, not
picking one forever.

## Outlets

### Vendor — sell for gold, buy items back

What: exchange items for `state.resource` (existing currency, no new
one needed), maybe buy convenience items in return.

- **Pro:** trivial to build — a price per item plus buy/sell UI.
  Gives a currency floor: whatever drops, it's always convertible to
  something.
- **Con:** doesn't really engage with *items* — it converts them back
  into the same resource fishing already produces directly, so it
  never answers "why do I need Tidal Pearl specifically." Weak fit for
  the zones pitch, and you already flagged it as likely-boring — this
  doesn't obviously get more interesting with more content, it just
  gets more prices to tune.

### Consume — survival (rations, water, vitamin C, clothing)

What: items get burned to satisfy decaying meters — hunger, vitamin
C/scurvy, temperature.

- **Pro:** directly answers "why do I need this material" — different
  meters want different items (protein vs. vitamin C vs. insulation),
  so zone choice starts mattering for *staying alive*, not just loot.
  Most mechanically novel of the outlets here — nothing like it exists
  yet.
- **Con:** biggest lift. Needs new decaying-meter state, tick logic for
  decay, and real consequences for hitting zero (does a starving net
  stop fishing? Drain resource? Something worse?). Also couples every
  item's design to "what survival need does this fill, if any,"
  which is a constraint items.js doesn't have today.

### Craft — combine/smelt/smoke → new items, raft upgrades, tech tiers

**Status: implemented, timed.** `RECIPES` (`recipes.js`) consume N
items to produce one output item. Crafting claims the self slot (same
one rummaging/sailing use — see `FEATURE_SLOTS_UPGRADE.md`) for the
recipe's `craftMs`, blocking other hands-on actions until it resolves
via `tick()` (`engine.js`) — it's not a free parallel action. A recipe
with no `craftMs` resolves on the next tick (effectively instant),
which is how the original `fishingRodOfDesperation` recipe still
behaves.

What: recipes consuming N items (+ maybe resource) to produce a new
item, a raft upgrade, or an equipment-slot/tech-tier unlock.

- **Pro:** best fit with the treasure-class/zone system already built
  — recipes create demand for *specific* materials from *specific*
  zones, which is the actual hook zones was built to prove ("sail to
  Zone 4 because the smelter recipe needs Tidal Pearl"). Can also
  absorb the sacrifice/totem idea below as one recipe shape (output is
  a stat/buff instead of an item) instead of it needing to be its own
  system.
- **Con:** needs a recipe data model plus a UI to browse/pick/confirm a
  craft — more moving parts than vendor, though no new *decaying*
  state to tick, unlike survival.

### Sacrifice — totem/universe-luck exchange for direct power

What: burn items directly for a stat/buff, no intermediate item
produced.

- **Pro:** simplest possible payoff loop — item in, permanent (or
  timed) power out. Could double as an early prestige-adjacent hook.
- **Con:** structurally this *is* a crafting recipe whose output
  happens to be a buff instead of an item — building it as a 4th
  standalone system means a 4th data model and UI for something
  Craft's recipe shape already covers. Only worth splitting out if it
  needs to feel meaningfully different from crafting (a totem
  altar/ritual UI, not a recipe list).

## Recommendation (not locked in)

Craft first — it reuses the zone/drop-table work directly and
actually demonstrates the "farm what you need" premise zones was built
to prove. Survival second — biggest payoff, most novel, but needs its
own decaying-meter substate spec'd before it's buildable, and was
already deferred once this session in favor of the equipment scaffold.
Vendor whenever, as a low-effort currency floor, not a priority.
Sacrifice folds into Craft's recipe shape rather than becoming a
separate system, unless you want the totem/ritual framing specifically
(then it's worth splitting out).
