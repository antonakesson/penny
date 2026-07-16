# Zones, Item Levels & Sailing — Feature Spec (Draft)

Status: **planning, not implemented**. `src/items.js` has an early draft
item list from before this doc existed — treat it as scratch, not spec.

## Goal

Turn the single flat catch mechanic into a Diablo-2-style loot game:
distinct zones, each with its own item level and curated drop table, that
the player deliberately sails between to farm what they need. Calm
starter waters, 10-20 zones of increasing difficulty/flavor, and a
world-map-style UI to sail with.

## Core concepts

### Zone

A zone is a fishing ground with:
- `id`, `name` (port name), flavor text
- `zoneLevel` — the D2 "area level" equivalent; gates which items can
  appear in its drop table
- `dropTable` — hand-curated weighted list of items (not auto-filtered
  by level; the author picks what belongs where, `zoneLevel` is a sanity
  check against `item.minZoneLevel`, not a runtime filter)
- `travelCost` — currency deducted immediately when a net departs for
  this zone
- `travelTimeMs` — how long the net spends in transit before it can
  fish (a net in transit is unavailable, same as active/recovery)

### Item level

Each item (`src/items.js`) carries a `minZoneLevel`. It's a design
constraint ("this shouldn't show up before zone level 8"), enforced by
whoever curates a zone's `dropTable`, not by a runtime roll. No
separate rarity-tier roll (magic/rare/etc.) in v1 — an item's `rarity`
field is flavor/display only (affects name color), not a drop-weight
multiplier.

### Drop resolution

Layers **on top of** the existing catch, doesn't change it:

1. Slot resolves exactly as today — `successChance` roll, `resource`
   yield on hit (unchanged).
2. Independently, roll the *net's assigned zone's* `materialDropChance`.
   On hit, weighted-pick one item from that zone's `dropTable`, add to
   a new `state.inventory` map, emit `itemDropped`.

This means gold/resource keeps flowing regardless of zone; zone choice
only changes *what materials* you're farming, matching "sail to Arctic
Shelf because you need Arctic Cod Glycerin."

## Decisions (locked in)

1. **Sailing cost — timed voyage.** Clicking Sail on a port starts a
   travel-time idle timer before the net arrives and can fish.
2. **Fleet scope — per-net zone assignment.** Each net has its own
   `zoneId` and can be redeployed independently; there's no single
   fleet-wide "current zone."
3. **Map fidelity — styled node graph.** Ports as positioned
   buttons/icons connected by lines, CSS/SVG only, no art asset. Real
   art can replace it later without touching the data model.
4. **Unlock model — fully open, cost is travel, not entry.** No port
   unlock gate. Every zone is sailable from the start; the tradeoff is
   that sailing costs currency *and* time, so redeploying a net is a
   real bet — you're spending accumulated catch and taking that net
   offline to chase a better (or specifically-needed) drop table
   elsewhere. This is also the answer to the original "how does
   difficulty scale in a game that gets easier" question: the
   difficulty curve isn't in the catching, it's in the logistics — is
   this move worth the resources and downtime.

This means `travelCost` and `travelTimeMs` become per-zone tunable
knobs, same spirit as `GATHER` in `config.js` — hand-authored per zone,
not formula-derived, so they're easy to rebalance during playtesting.

**Scoping call:** travel cost/time is a flat property of the
*destination* zone, independent of the net's current zone (not a
distance matrix between every port pair). Simpler for v1, and still
satisfies "deeper zones cost more to reach." Revisit once ports have
real map coordinates if point-to-point distance turns out to matter.

## Draft zone list (14 zones)

| # | Port | Zone Lvl | Travel Cost | Travel Time | Flavor | Signature material |
|---|------|----------|-------------|-------------|--------|---------------------|
| 1 | Calm Cove | 1 | 0 | 0s | Tutorial waters, glassy and boring on purpose | Herring |
| 2 | Coastal Shallows | 2 | 16 | 3s | Tide pools, gulls, mild disappointment | Rusty Hook |
| 3 | Fisherman's Strait | 3 | 24 | 4.5s | Crowded with actual competent fishermen, embarrassing | Bluefin Scale |
| 4 | Merchant Lanes | 5 | 40 | 7.5s | Cargo routes, storms, the occasional bribe-ready customs boat | Waterlogged Ledger |
| 5 | The Doldrums | 6 | 48 | 9s | No wind, no fish, no hope — a comedy zone, low reward on purpose | Becalmed Timber |
| 6 | Storm Belt | 7 | 56 | 10.5s | Lightning, rogue waves, insurance fraud opportunities | Storm-Tossed Buoy |
| 7 | Arctic Shelf | 8 | 64 | 12s | Ice floes, seals judging you | Arctic Cod, **Arctic Cod Glycerin** |
| 8 | The Ice Pack | 9 | 72 | 13.5s | Deeper cold, hull-groaning pressure | Frostbitten Net Scrap |
| 9 | Kraken Depths | 12 | 96 | 18s | Tentacles, occasional net loss (future hazard hook) | Kraken Ink Sac, Abyssal Pearl |
| 10 | Siren Reefs | 15 | 120 | 22.5s | Beautiful, deadly, your crew keeps "just going to look" | Siren Scale, Enchanted Coral |
| 11 | The Maelstrom | 17 | 136 | 25.5s | A literal whirlpool you fish at the edge of, professionally unwise | Whirlpool Shard |
| 12 | Ghost Fleet Graveyard | 18 | 144 | 27s | Derelicts, fog, a suspicious number of unclaimed hats | Spectral Rigging |
| 13 | The Bounty's Wake | 20 | 160 | 30s | Mutiny-adjacent waters, morale mechanics live here later | Mutineer's Ledger Page, Bounty Doubloon |
| 14 | The Judgment Deep | 25 | 200 | 37.5s | Endgame abyss, where prestige resets probably point you | Captain's Lost Compass |

Names/flavor/numbers are placeholders for tone-and-shape-check, not
final balance — easy to retune since content lives in data, not code.
Every net starts docked at Calm Cove. Travel cost/time seeded from
`zoneLevel × 8` / `zoneLevel × 1.5s` as a starting curve, not a runtime
formula — each row is hand-editable independently.

## UI: the map

WoW-world-map-style, per net: ports as clickable nodes on a styled
node-graph (positioned icons/buttons + connecting lines, CSS/SVG, no
art asset), "Sail" as the verb.

Flow: click a net → its card opens a map view → click a port → see its
zone level, travel cost/time, and drop table preview → confirm Sail →
net's status becomes `sailing`, cost deducted immediately, progress bar
like casting/recovery → on arrival, net's `zoneId` updates and it's
`idle`, ready to cast in the new waters.

Each net's card (in the existing `.slot-btn` area) needs to show its
current port name alongside its cast/cooldown status, since nets can
now be scattered across different zones at a glance.

## State model additions

- `slot.zoneId` — which zone this net is currently docked/fishing in
  (all start at `calmCove`)
- `slot.status` gains a fourth value: `'sailing'` (alongside
  `idle`/`active`/`recovery`)
- `slot.targetZoneId` — set when sailing starts, cleared on arrival
  (needed since `startedAt` alone doesn't say *where to*)
- `state.resource` — spent on travel cost, same field as today (no new
  currency type)
- `state.inventory` — new, `{ itemId: count }`

## New/changed files

- `src/zones.js` — zone defs + drop tables + travel cost/time (content,
  like a level list — not routed through `flavor.js`, since zones *are*
  content, not a skin over generic mechanics)
- `src/items.js` — revise the current draft to match the table above
- `src/state.js` — add `inventory`; extend slot shape with `zoneId` /
  `targetZoneId`
- `src/engine.js` — add `sailSlot(index, targetZoneId)`; extend `tick()`
  to resolve `sailing` status on arrival; add the second (material)
  roll in `resolveSlot`, keyed off the net's `zoneId`
- new UI module for the per-net map view + port nodes, plus inventory
  display
- `src/actions.js` / `main.js` — wire the map-open / sail interaction

## Defaults being assumed (flag if wrong)

These are implementation calls I'm making without a separate question
round — cheap to change later, not architecture-shaping:

- A net must be `idle` to start sailing (can't redeploy mid-cast or
  mid-cooldown); sailing itself can't be cancelled once started, and
  the travel cost isn't refunded.
- Arriving at a new zone leaves the net `idle` — it doesn't
  auto-recast; the player still clicks to cast, same as today.
- No re-validation that a net can *afford* to sail beyond the upfront
  `resource >= travelCost` check at the moment Sail is clicked.

Not blocking, flagged for later: zone-specific hazards (Kraken net
loss, Siren distraction) were floated earlier as flavor for
*difficulty* scaling but aren't in this drop-table-focused pass —
separate feature if wanted.
