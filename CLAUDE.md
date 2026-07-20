# penny

Static HTML/JS idle game — no build step, no dependencies. See
`README.md` to run it.

## What's actually here right now

One action: click the single self slot ("Unarmed") to attack. It runs
for `GATHER.activeMs`, resolves a 50/50 success roll, and on success
deals flat placeholder damage (`attackDamage()`, currently `1`) to
`state.monster`'s hp; either way the slot goes into a short recovery
cooldown, then back to idle. Killing the monster rolls loot from *its*
own `drop` id (`resolveDropId`, `loot.js`) into `state.inventory` and
spawns the next monster from the current zone. Results show up as
floating text (damage over the `#enemy` panel, loot/miss over the
slot) — there's no persistent inventory/stats display in the UI right
now. A `#zone`/`#enemy` panel shows where you are and what you're
fighting (name, level, hp bar), from `zones.js`/`monstats.js`. A Save
button persists state to `localStorage`.

That's the whole game today.

## Current target: Diablo 2-light

Present one monster at a time; click to kill it, get loot. The core
loop is working end to end now (dummy zone/monster data, real damage,
real per-monster loot) — remaining work here is content (real zones
and monsters instead of the one dummy each) rather than plumbing.

- **Zones** — a zone has a monster level and a list of monsters it can
  spawn (a basic `levels.txt`). `zones.js`, one dummy entry.
- **Monsters** — type, HP, loot table (a basic `monstats.txt`).
  `monstats.js`, one dummy entry.
- **Loot/treasure class** — `loot.js`, see the registry table below.

Next: damage, level, skill tree, stats, item attributes — attack
damage is currently a flat placeholder (`attackDamage()` in
`engine.js`, returns `1`), the future home for talents/stats/
equipment/resistances. After a 1.0 release: prestige, more items, more
monsters.

New gameplay mechanics get added over time, driven by actually playing
the game and seeing what it needs next — not by drafting multiple
systems' worth of design ahead of playtesting them. If a new mechanic
is worth designing in writing before building, that's a `FEATURE_<NAME>.md`
doc at the repo root, deleted once it's either built or abandoned (not
left around describing something no longer true).

## Closed ID registries, cross-referenced by string id

Each independent game system is one flat, closed dict, keyed by string
id. Systems reference each other **only** by id, never by embedding or
duplicating another system's data. A consumer resolves an id against
the registry that owns it; it never needs to know that registry's
internal shape beyond "given this id, give me the thing."

| Registry | File | Keyed by | Its entries reference |
|---|---|---|---|
| `TREASURE_CLASSES` | `loot.js` | TC id | `entries`: other `TREASURE_CLASSES` ids (recursive) or `ITEMS` ids |
| `ITEMS` | `loot.js` | item id | terminal — leaf data (name, optional description), references nothing further |
| `ZONES` | `zones.js` | zone id | `monsters`: a list of `MONSTERS` ids |
| `MONSTERS` | `monstats.js` | monster id | `drop`: a `TREASURE_CLASSES`/`ITEMS` id |

`TREASURE_CLASSES` and `ITEMS` both live in `loot.js` — an exception to
"own file per registry" because they're inseparable from the
resolution logic that walks one into the other (`resolveDrop`, below);
splitting them would just move an import line around, not add
isolation. Everything *outside* `loot.js` still only ever sees ids:
`engine.js` calls `resolveDrop(DROP_TABLE)` and gets back an item id
or `null`, with zero knowledge of weights, TC nesting, or that a
"drop table" is a weighted list at all. `render.js` imports
`ITEMS`/`ITEM_RARITY` from `loot.js` for name/rarity display, and
`MONSTERS` from `monstats.js` for the enemy panel's name — both
read-only use-sites, not resolution logic.

`loot.js`'s `resolveDrop` is the clearest example of what the id-only
boundary buys: one recursive function resolves the drop table through
any depth of nested treasure classes down to a leaf item, because
every step is just "look up this id in that registry." Adding a new
TC needs zero changes to `resolveDrop` itself.

**Rule of thumb for new systems:** before adding a new gameplay
concept, ask whether it's a **new closed registry** (its own file, its
own id-space, other systems will reference it by id) or a **use-site**
of an existing one (it just needs to point at an id that already
exists somewhere).

- New registry → give it its own file, flat object keyed by id, no
  nesting of another registry's full data inside it (reference the id,
  don't copy the shape).
- Use-site → add the reference (a string id), don't invent a new field
  shape to carry the same information a registry lookup would give you
  for free.

## How systems interact (runtime wiring)

- **`state.js`** owns the single source of truth (`getState()`) and a
  `subscribe`/`notify` channel used *only* to drive re-renders —
  anything that mutates state (`addItem`, `setSlotStatus`, etc.) calls
  `notify()`, and `render.js`'s `subscribe(render)` re-renders the
  whole UI from the current snapshot every time. This channel doesn't
  carry *what* changed, only *that* something did.
- **`events.js`** is a separate, second pub/sub (`on`/`emit`) for
  discrete one-shot notifications that aren't "the state changed,
  redraw" — `itemDropped`, `slotFailed`, `slotActivated`, `slotResolved`,
  `monsterHit`, `monsterKilled`. `engine.js` emits these right after
  the state mutation that caused them. Consumers are side effects that
  care about the specific event, not a full re-render: `main.js` plays
  a coin/woop sound, `render.js` spawns floating combat text. Don't
  conflate the two channels — state changes always go through
  `state.js`'s `notify`, one-shot side effects always go through
  `events.js`.
- **`engine.js`** is where game logic lives: it reads `getState()`,
  decides whether an action is legal, calls `state.js` setters to
  mutate, and `emit()`s the corresponding event. `render.js` and
  `main.js` never mutate state directly — they call into `engine.js`
  (`activateSlot`, `tick`). It owns the combat loop — the hit roll,
  damage, death check, respawning the next monster via `spawnMonster`
  — but not *what* drops on a kill — that's `loot.js`.
- **`loot.js`** owns *what* drops: `ITEMS`, `TREASURE_CLASSES`,
  `resolveDrop` (weighted-list entries, e.g. a TC's own `entries`) and
  `resolveDropId` (a single id, the shape a monster's `drop` field
  points at). `engine.js` calls `resolveDropId(monsterDef.drop)` on a
  kill and treats the result as an opaque item id or `null` — no
  weighted-table logic outside this file.
- **`tick()`** (`engine.js`, driven by `main.js`'s
  `setInterval(tick, 100)`) is the only place time-based state
  transitions happen — active → recovery → idle. Progress-bar `%` math
  in `render.js` independently recomputes `Date.now() - slot.startedAt`
  against the same `GATHER` durations `tick()` checks against; keep
  both reads using the same source values rather than let them drift
  apart.
- **`render.js`** is presentation-only: it reads state and the
  flavor-text module (`flavor.js`) and writes DOM. It never decides
  game logic, only how to display the result of logic that already
  ran in `engine.js`.
- **`storage.js`** save/loads `state.js`'s snapshot tagged with a
  `SAVE_VERSION`. No migration chain — this is one local player, not an
  install base to protect, so a version mismatch just wipes the save
  and starts clean rather than transforming old shapes forward. Bump
  the constant on any state shape change.
