# Encounter Refactor — Plan

One-off implementation plan (contrast `ACT_1_STORYLINE.md`, a living
reference doc) — delete or fold into commit history once built, same
role `FEATURE_EQUIPMENT.md` plays for its own feature.

## Why now, and why not more

`Monster`/`EncounterAction`/`ActionHandler` were generalized from exactly
two real consumers: attack and investigate. That followed the right rule
(don't abstract for hypothetical cases) but both consumers turned out to
be the *same* shape twice — hp drains over time, resolving to a hit/no-hit
boolean, differing only in continuous-vs-discrete input timing. Recruit
Pet (a multi-choice "Bribe (cost 2 honeycomb)" / "Shoo away" stage of
the Rabid Squirrel event) is the first consumer that's genuinely a
different shape, and it exposes what the first two examples let us get
away with:

- `Monster.hp`/`maxHp` exist even when they mean nothing —
  `hastilyAbandonedCamp` fakes `level: 1, maxHp: 300` purely to get a 75s
  timer out of investigate's dps math (`INVESTIGATE.dps` is 4 —
  300 / 4 = 75s). A stat block with no narrative meaning, kept only
  because it was the path of least resistance.
- `ActionHandler`'s `onDown()/onUp()/tick(): boolean` contract assumes
  "there's a hit/no-hit moment, then a separate damage number" — a
  property of hp-drain resolution, not of "an action" in general. A
  discrete N-option choice doesn't have a hit/no-hit moment at all.

Same reasoning turns out to apply one level down: attack and investigate
were merged into one `Monster` type because generalizing from two real
consumers was cheap and they shared a resolution mechanism — but they
don't share a *stat block*. `level` and `maxHp` are real, level-scaled
numbers for a Boar; for `hastilyAbandonedCamp` they're a fake identity
and a reverse-engineered timer. Splitting `Monster`/`Investigation` isn't
a new abstraction, it's undoing an over-merge the same rule would have
caught if Recruit Pet hadn't surfaced it first.

Doing this refactor before building Recruit Pet costs the same as doing
it after, minus building the squirrel against the old shape and paying
the migration twice. Not doing more than this: no generic "arbitrary
JSON config per action" escape hatch — that throws away the compile-time
exhaustiveness (`switch` + `assertNever`) this codebase already invested
in (`a0c106d`). Stay closed and typed: a sealed union, extended one real
variant at a time. That same rule is why Recruit Pet's encounter gets a
concrete `RabbidSquirrel` type, not a generic `action: 'choice'` — one
real consumer, not two, so nothing to generalize from yet.

## Problems with the current shape

1. **One flat `Monster` type for every encounter**, but several fields
   are only meaningful for hp-drain kinds (`hp`/`maxHp`) or are pure
   engine-logic payloads no UI ever reads (`dropTableId`, `xpReward`) —
   and within hp-drain, `level`/`maxHp` are only meaningful for attack;
   investigate fakes both (see "Why now").
2. **Dispatch-by-action is split across two uncoordinated places** with
   no compiler link between them: `App.svelte`'s
   `{#if encounter.action === 'investigate'}` picks the meter component;
   `Monster.svelte` separately assumes an hp-card shape and only
   cosmetically varies by action (fill color). Adding a kind means
   remembering to touch both, nothing catches a missed spot.
3. **`action` is quietly load-bearing for three unrelated things** — which
   meter mounts (`App.svelte`), which handler resolves input
   (`engine.ts`'s `currentHandler()`/`damageForKind()`), and hp-bar
   styling (`Monster.svelte`) — with no single place that owns "given
   this kind, here's everything about it."
4. **`ActionState` (the timing mutex) is a separate slice `Monster` never
   touches**, and both meters read `ActionState`, never `Monster`,
   directly. Worth stating plainly because it means a new kind can
   choose to skip the mutex entirely rather than inherit it by default.
5. **`instanceId` is UI-transition plumbing wearing a data-field
   costume** — it exists only to key the hp-fill bar's transition reset
   between monsters, not to represent anything about the encounter.
6. **Zone/event content and shape are entangled.** `zones.ts`'s
   `monsters: MonsterId[]` and `MonsterId = keyof typeof MONSTERS` bake
   in an assumption that anything a zone can pick, or an event can
   inject, is a `Monster`. There's already a precedent this contradicts
   in practice — `hastilyAbandonedCamp` lives in the same `MONSTERS`
   table as every zone monster but is deliberately *excluded* from
   `zones.ts`'s pool and only reachable via `shouldShowEvent()`
   (zones.ts:43-48). The type system doesn't know that's a content
   choice, not a structural one — nothing stops a future kind from being
   accidentally un-pickable by one source or the other just because its
   id type doesn't line up.

## Design principles for the new shape

- `Encounter` becomes a sealed/discriminated union — `Monster | Investigation
  | RabbidSquirrel` — not one flat interface with sometimes-fake fields,
  and not one `Monster` type carrying both attack and investigate. Each
  variant only carries fields real for it; `action` stops being a union
  living on a shared shape and becomes each variant's own single-literal
  discriminant (`'attack'` / `'investigate'` / `'rabbidSquirrel'`).
- **One shared registry, one id space.** All encounter defs — whatever
  kind — live in a single table (`encounters.ts`'s `ENCOUNTERS`, the
  widened successor to today's `monstats.ts`'s `MONSTERS`), keyed by a
  single `EncounterId`. `zones.ts`'s pool and `shouldShowEvent()` both
  become **shape-blind id sources** — they hand back an `EncounterId`,
  a single `createEncounter(id)` resolver is the only place that looks
  at the def's kind and builds the right runtime shape. This directly
  fixes problem 6: any zone or event can reference any registered
  encounter regardless of kind; whether something is one-shot vs.
  repeatable, or zone-pickable vs. event-only, stays a content decision
  (an id simply not being listed in a given zone's pool), never a type
  constraint.
- UI dispatch collapses to **one switch, in one component**
  (`<Encounter/>`), producing a matched (card, interaction) pair per
  kind — replacing `App.svelte`'s meter `{#if}` and `Monster.svelte`'s
  action-conditional styling.
- Each kind independently decides whether it needs the `ActionState`
  timing mutex at all. Attack/investigate: yes. `RabbidSquirrel`'s
  discrete click-to-pick: no, for now — see decision 1 below.
- The post-resolution pause (`ENCOUNTER_END_MS`) is **base `Encounter`
  behavior, not a per-kind opt-in** — `status`/`diedAt` live on
  `EncounterBase`, so `tick()`'s existing dead-then-pause-then-respawn
  check already applies uniformly to every kind, `RabbidSquirrel`
  included. See decision 2 below.
- Resolution/grant logic becomes **a per-kind resolve function**, not one
  `resolveKill()` that unconditionally calls `awardLoot()`. `RabbidSquirrel`
  resolves into whatever its picked option grants (a pet, nothing, a
  decline), not loot+xp bent into the right shape.
- `pickEncounter`'s weighted-pick mechanism and `pickLevel`'s scaling
  curve are structurally untouched — they still just pick an
  id/level pair off a weights table, blind to what shape the id resolves
  to. What *does* change is their input/output types (`MonsterId` →
  `EncounterId`) and the content table they read from (see above).

## Proposed shape

```ts
// types.ts
interface EncounterBase {
  instanceId: number; // UI-transition key only, see problem 5 — not persisted as meaningful data
  id: string;
  name: string;
  entryNo: number;
  status: 'active' | 'dead';
  diedAt: number | null;
  isNewDiscovery: boolean;
}

// hp-drain, discrete-swing resolution.
export interface Monster extends EncounterBase {
  action: 'attack';
  level: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

// hp-drain, continuous-hold resolution — same resolution mechanism and
// runtime shape as Monster (hp/dps stay intact, see decision 3 below),
// but its own real fields: no `level` (meant nothing for
// hastilyAbandonedCamp, see "Why now"); `maxHp` is derived at
// construction time from an honestly authored duration, not authored
// directly as a guessed hp number.
export interface Investigation extends EncounterBase {
  action: 'investigate';
  hp: number;
  maxHp: number; // derived from InvestigationDef.durationMs + INVESTIGATE.dps
  xpReward: number;
  dropTableId: readonly string[];
}

// Discrete, click-to-resolve — no ActionState mutex for now (decision 1).
// Has `level` — recruiting the squirrel is expected to scale like a real
// encounter (decision 4), unlike Investigation. Real fields beyond that
// (stage, options, cost, outcome) land with the Rabid Squirrel follow-up;
// this variant exists here only to prove the sealed union / registry /
// <Encounter/> dispatch handles a non-hp-drain kind end-to-end, behind a
// deliberately simple placeholder UI (decision 5).
export interface RabbidSquirrel extends EncounterBase {
  action: 'rabbidSquirrel';
  level: number;
}

export type Encounter = Monster | Investigation | RabbidSquirrel;
```

```ts
// data/encounters.ts — widened successor to monstats.ts
interface MonsterDef {
  kind: 'monster';
  name: string;
  level: number;
  entryNo: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
  description?: string;
}

interface InvestigationDef {
  kind: 'investigation';
  name: string;
  entryNo: number;
  durationMs: number; // authored honestly, not a guessed maxHp — see "Why now"
  xpReward: number;
  dropTableId: readonly string[];
  description?: string;
}

interface RabbidSquirrelDef {
  kind: 'rabbidSquirrel';
  name: string;
  entryNo: number;
  level: number;
  // remaining fields TBD — see Rabid Squirrel follow-up
}

type EncounterDef = MonsterDef | InvestigationDef | RabbidSquirrelDef;

export const ENCOUNTERS = {
  boar: { kind: 'monster', name: 'Boar', level: 1, entryNo: 1, maxHp: 5, xpReward: 2, dropTableId: ['boarDrops'] },
  thornyShrubbery: {
    kind: 'investigation',
    name: 'Thorny Shrubbery',
    entryNo: 4,
    durationMs: 2_000, // was maxHp: 8 at dps 4
    xpReward: 3,
    dropTableId: ['shrubberyDrops'],
  },
  hastilyAbandonedCamp: {
    kind: 'investigation',
    name: 'Hastily Abandoned Camp',
    entryNo: 16,
    durationMs: 75_000, // was maxHp: 300 at dps 4 — same 75s, honestly authored now
    xpReward: 100,
    dropTableId: ['hastilyAbandonedCampDrops'],
    description: "The embers are still warm. …",
  },
  // ...rest of today's MONSTERS entries, mechanically re-keyed with `kind`.
} as const satisfies Record<string, EncounterDef>;

export type EncounterId = keyof typeof ENCOUNTERS;
```

`Monster` keeps its name (minimal churn — most of the codebase already
says `Monster`); `Encounter` is the new union that `encounter.svelte.ts`'s
`current` is typed as.

## Component split

`<Encounter/>` (currently a thin `<Monster/>` + `<FloatingText/>` wrapper)
becomes the single switch:

```
action: 'attack'         → <MonsterCard/>       + <AttackMeter/>
action: 'investigate'     → <InvestigationCard/> + <InvestigationMeter/>
action: 'rabbidSquirrel'  → <RabbidSquirrelCard/> (buttons ARE the interaction, no separate meter)
```

`Monster.svelte`'s current body becomes `<MonsterCard/>` verbatim — a pure
extract/rename, no behavior change, so the refactor's first step is
provably behavior-preserving before any new kind gets added.
`<MonsterCard/>`/`<InvestigationCard/>` will likely share most markup
(both render a fill-bar), whether that ends up one parameterized
component or two near-identical ones is an implementation call, doesn't
affect the type-level split above. `<RabbidSquirrelCard/>` ships as a
deliberately minimal placeholder (name + a single continue/dismiss
button) — real multi-choice UI is part of the deferred follow-up
(decision 5), not this refactor.

## engine.ts changes

- `createEncounter(id, level?)` — new single resolver. Looks up
  `ENCOUNTERS[id]`, switches on `def.kind`, dispatches to
  `createMonster()` / `createInvestigation()` / `createRabbidSquirrel()`.
  This is the one place that turns a shape-blind id into a concrete
  `Encounter`.
- `createMonster()` keeps its current body (renamed internally to take a
  `MonsterDef` instead of doing its own table lookup); `createInvestigation()`
  is new but small; `createRabbidSquirrel()` is a stub until the
  follow-up.
- `decideNextEncounter()` **unchanged in structure** — same
  replay-charge → `shouldShowEvent()` → `pickEncounter(zone)` priority —
  just calls `createEncounter(id, level)` instead of `createMonster(id, level)`
  at each of the three return points.
- `zones.ts`: `monsters: MonsterId[]` → `encounters: EncounterId[]`;
  `pickEncounter()` return type widens to `EncounterId`.
- `events.svelte.ts`: `shouldShowEvent()` return type widens from
  `MonsterId | undefined` to `EncounterId | undefined` (mechanism
  unchanged — it already just returns an id).
- `currentHandler()`/`damageForKind()`/`applyHit()`/
  `calculateInvestigationDamage()` stay hp-drain-only and genuinely
  untouched (decision 3) — now explicitly typed over
  `Monster | Investigation` rather than `Monster`, but the mechanism
  itself doesn't change. `RabbidSquirrel` never enters this path at all
  (no `ActionState` mutex, per decision 1); `<RabbidSquirrelCard/>`'s
  button calls the new resolve function directly.
- `resolveKill()` splits: `Monster`/`Investigation` (hp-drain kinds)
  keep the existing `awardLoot()` path, triggered by hp reaching zero.
  `RabbidSquirrel` gets a new
  `resolveRabbidSquirrelPick(option)` (naming TBD), triggered by a
  button click, setting `status: 'dead'`/`diedAt` the same way
  `killMonster()` does so the base `tick()` pause-then-respawn logic
  (see design principles) picks it up with no special-casing — with its
  own `switch (option.outcome) { ... default: assertNever(option.outcome) }`,
  outcome shape fully deferred to the Rabid Squirrel follow-up.

## Save / migration

`EncounterSnapshot` needs the same union treatment as `Encounter`, or at
minimum a branch on `action` in `hydrateEncounter()` (same trick it
already uses: reconstruct via `createEncounter()`, then overlay
persisted runtime fields). Save version bump + migration — same
discipline already used twice for encounter-shape changes (`a0c106d`,
`b56d6f6`).

## Decisions

1. **`RabbidSquirrel` + `ActionState` mutex — deferred.** The
   placeholder `RabbidSquirrel` skips `ActionState` entirely (nothing to
   hold/cool on a stub with no real interaction yet). Whether a future
   multi-stage version ever wants timing is revisited only when the
   actual stages (Investigate → Argue/Choice → Recruit) are built.
2. **Corpse-pause beat (`ENCOUNTER_END_MS`) — yes, uniformly.** Not a
   per-kind decision; it's base `Encounter` behavior via
   `status`/`diedAt` on `EncounterBase`. `resolveRabbidSquirrelPick()`
   just needs to set those fields like `killMonster()` does — `tick()`'s
   existing dead-then-pause check needs no kind-awareness at all.
3. **`Investigation`'s runtime fields — keep hp/dps intact.** Stays
   `hp`/`maxHp`, resolved through the existing dps mechanism — reverted
   from an earlier lean toward `elapsedMs`/`durationMs`. `maxHp` is
   still derived from `InvestigationDef.durationMs`/`INVESTIGATE.dps` at
   `createInvestigation()` time, so the def layer is still honestly
   authored (fixes problem 1), but `applyHit()`/
   `calculateInvestigationDamage()` stay genuinely untouched — no
   engine-mechanism churn for this.
4. **Level scaling — `Monster` and `RabbidSquirrel`, not `Investigation`.**
   `level` isn't promoted to `EncounterBase` (Investigation shouldn't
   inherit something meaningless to it); `Monster` and `RabbidSquirrel`
   each declare their own `level: number` independently. `pickLevel()`'s
   zone-difficulty scaling is meaningful for both — a recruited pet is
   expected to scale like a real encounter, same as a monster.
5. **`RabbidSquirrel`'s real attributes — deferred, ship a simple
   placeholder UI.** `<RabbidSquirrelCard/>` proves the plumbing (a
   name + one button), not the actual Bribe/Shoo choice. Real content
   is the follow-up, out of scope here.

## Not yet built (tracked here for visibility)

- Sealed `Encounter` union (`Monster | Investigation | RabbidSquirrel`)
  in `types.ts`.
- Single `ENCOUNTERS` registry (`data/encounters.ts`, widened
  successor to `monstats.ts`) with a discriminated `EncounterDef` union;
  `EncounterId = keyof typeof ENCOUNTERS`.
- `createEncounter(id, level?)` resolver in engine.ts, replacing direct
  `createMonster()` calls at every call site.
- `zones.ts`: `monsters` → `encounters: EncounterId[]`; `events.svelte.ts`:
  `shouldShowEvent()` return type widens.
- `<Encounter/>` absorbing dispatch from `App.svelte` + `Monster.svelte`;
  `<MonsterCard/>` extracted from current `Monster.svelte`;
  `<InvestigationCard/>`; `<RabbidSquirrelCard/>` placeholder.
- `resolveRabbidSquirrelPick()` (naming TBD) in engine.ts.
- `EncounterSnapshot` save-shape update + version bump + migration.
- The Rabid Squirrel's actual stages (Investigate → Argue/Choice →
  Recruit) — separate follow-up once this plumbing lands, out of scope
  for this doc.

## Build order

1. `Encounter`/`Monster`/`Investigation`/`RabbidSquirrel` types + single
   `ENCOUNTERS` registry (no behavior change yet — registry starts as a
   mechanical split of today's `MONSTERS` table into the union shape,
   `hastilyAbandonedCamp`/`thornyShrubbery` re-authored with `durationMs`
   instead of fake `level`/`maxHp`).
2. `createEncounter()` resolver; wire `decideNextEncounter()`, `zones.ts`,
   `events.svelte.ts` through it. Prove behavior-preserving (existing
   attack/investigate flow unaffected) before touching anything new.
3. Extract `<MonsterCard/>`/`<InvestigationCard/>` from `Monster.svelte`;
   move `App.svelte`'s meter `{#if}` into `<Encounter/>`.
4. `RabbidSquirrel` type usage, minimal placeholder `<RabbidSquirrelCard/>`,
   `resolveRabbidSquirrelPick()`, a throwaway zero-content registry
   entry — proves the plumbing end-to-end per decision 5.
5. Save schema + version bump + migration.
6. Only then: author the Rabid Squirrel's real stages on top of the new
   plumbing.
