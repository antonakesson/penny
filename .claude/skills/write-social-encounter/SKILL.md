---
name: write-social-encounter
description: Author a new social/dialog encounter (branching conversation POI) for the game — dialog tree authoring mechanics plus this game's specific comedic voice. Use when asked to write a new NPC/object encounter, add dialog choices, or extend an existing dialog tree.
---

A social encounter is a branching conversation POI (the genie, the
squirrel, the outhouse, the creek — all in `src/lib/game/data/dialog/`).
This skill covers both halves: how the dialog system actually wires
together, and the voice this game writes in, which is unusually specific
and easy to get wrong in an obvious-sounding way (puns/euphemism read as
a failure state here, not a style choice).

## The pipeline, end to end

Adding a social encounter touches up to five files. Only #1 and #2 are
required; the rest are opt-in depending on what the dialog does.

1. **`src/lib/game/data/dialog/<name>.ts`** — the node tree itself, one
   file per encounter. Default-exports `Record<string, DialogNode>`,
   glob-loaded automatically by `dialog.ts` (no import list to update).
   Node ids are conventionally `'<name>:<node>'` (e.g. `'genie:root'`,
   `'genie:whoAreYou'`) — the `<name>:` prefix keeps every tree's ids
   collision-free in the single flat `DIALOGS` map.
2. **`src/lib/game/data/encounters.ts`** — register a `SocialDef` entry
   in `ENCOUNTERS`: `{ kind: 'social', name, level, dialogRoot: '<name>:root' }`.
   `dialogRoot` is the node the encounter opens on.
3. **`src/lib/game/data/zones.ts`** — place the encounter id somewhere a
   player can reach it: a subzone's `pois` array (a one-off landmark,
   the usual case for a social — see `rabbidSquirrel`/`occupiedOuthouse`)
   or its `encounters` weighted pool (if it should spawn ambiently/
   repeatably instead of as a fixed landmark).
4. **`src/lib/game/data/characters.ts`** — if a node's `speaker` is a new
   character (not `'narrator'`), add its `CharacterId` and default
   display name here. A `rename` line can override the name later for
   that encounter without touching this file.
5. **`src/lib/game/data/effects.ts` / `condition.ts` / `journalFlags.ts` /
   `journalEntries.ts`** — only if the dialog needs to grant items, gate
   a choice on prior state, or leave a permanent flag/journal trace (see
   "Hooking into the rest of the game" below).

Read `src/lib/game/data/dialog.ts` (~65 lines) for the actual types
before writing — the summary below can drift from the source.

## Dialog node mechanics

```ts
export interface DialogNode {
  lines: readonly DialogLine[];
  choices?: readonly DialogChoice[];   // absent/empty = terminal, conversation ends here
}

type DialogLine =
  | { kind: 'say'; speaker: Speaker; text: string }      // the only kind that renders
  | { kind: 'action'; effect: EffectId }                  // fires an EFFECTS entry, silent
  | { kind: 'rename'; character: CharacterId; name: string }; // silent, persists rest of encounter

interface DialogChoice {
  text: string;
  next: DialogNodeId;
  when?: Condition;      // absent = always visible; evaluated once per render, no mid-node flicker
  uniqueId?: string;     // absent = always re-offered; present = hides itself forever once picked
}
```

Things worth knowing that aren't obvious from the shape alone:

- **All of a node's `say` lines render at once** — there's no
  line-by-line reveal/typing effect, so don't write a node expecting a
  pause between lines. Sequencing across a *conversation* happens by
  splitting into more nodes, not more lines.
- **`action`/`rename` lines fire once, on arrival at the node**, in
  array order, before the node's `say` lines are read. A node that both
  renames a character and has them speak always shows the post-rename
  name.
- **Terminal node (no `choices`) ≠ encounter resolved.** The player still
  has to read the last line and dismiss it (`dismissDialog()` in
  `engine.ts`) before the encounter actually completes — a one-line
  terminal node like `interruptingCreek:jump` is fine, don't feel
  obligated to add a hollow "..." choice just to give it a next step.
- **`uniqueId` is one-shot per choice, not per node**, and only needs to
  be unique within that node — it's how "who are you?"-style options
  stop being re-offered after being picked once (see `genie:whoAreYou`).
- **`when` can reference cross-encounter state** — `hasItem`, `hasFeature`,
  or a journal `flag` (see `condition.ts`) — which is how `genie:root`
  offers a squirrel-only branch (`when: { kind: 'hasFeature', feature: 'pet' }`)
  without the genie dialog knowing anything about the pet system beyond
  that one condition.
- **Loops are just choices pointing at an earlier node id** — a dialog
  tree isn't required to be a DAG; `genie:whoAreYou`'s "Fine." choice
  routes back to `genie:root`.

## Hooking into the rest of the game

- **Granting/consuming items, unlocking features:** add an `EffectId` to
  `effects.ts`, fire it with an `{ kind: 'action', effect: '...' }` line.
  `swapItem` is the pattern for "this consumable is now spent" (see
  `spendGenieWish`, fired from every genie node that actually resolves
  the wish — but not `genie:nevermind`, so declining leaves the bottle
  reusable).
- **Gating a choice on prior state:** a `Condition` in `condition.ts`
  (`hasItem` / `hasFeature` / `flag`) on the choice's `when`.
- **Leaving a permanent record:** `FLAG_TRIGGERS` in `journalFlags.ts`
  maps a dialog node id (or encounter/item id) to a `FlagId` — set once,
  checked later via the `flag` condition. Two mutually-exclusive outcome
  nodes of the same encounter can each set a different flag (see
  `outhouse:accident` vs `outhouse:enter`).
- **Journal prose:** `JOURNAL_ENTRIES` in `journalEntries.ts`, keyed by
  the same id space (encounter id for the spawn-time entry, dialog node
  id for entries logged as the conversation progresses — both fire
  automatically, no extra wiring needed once the entry exists;
  `dialogNode()` in `engine.ts` calls both `logEntry` and
  `applyFlagTrigger` for every node reached).

None of this is required — a dialog tree with zero effects, conditions,
or flags (like `interruptingCreek`) is a complete, valid encounter.

## Voice — read before drafting prose

This is the part that's easy to get wrong even with the mechanics right.
Full compass: [[game-vision]] memory (`game_vision.md`) — read it, this
is a condensed pointer, not a replacement.

**The one failure mode to actively avoid: puns and cute euphemism.**
A first draft of the outhouse encounter used wordplay ("finished",
"dignity leaves first") to gesture at its outcome — verdict was "came
more childish than hilarious." The fix wasn't removing the joke, it was
changing *how* it's delivered:

- **Never state the joke.** Write dense, specific, straight-faced prose
  and let the reader assemble the punchline themselves, with a delay.
  Gold standard: the squirrel standoff (`squirrel:greet`→`squirrel:offer`)
  and the Knotted Twine Ring's flavor text (`"Too small for a wrist. Too
  big for a finger."`) — most readers won't think twice; the ones who do
  construct something much darker/cruder than what's on the page. If a
  line needs a pun or a wink to land, it's the wrong line.
- **Crudeness ceiling:** the Ring is the reference point for how far to
  go — land there or funnier, never cruder.
- **Three reusable veins**, independent of each other, don't blend them
  in one bit:
  1. *Register mismatch* — total epic sincerity applied to a trivial
     subject, sustained without collapsing into either pure satire or
     pure earnestness (the genie's deadpan matter-of-factness).
  2. *Bureaucracy as procedure, not wordplay* — invented rules,
     entitlements, paper trails described with administrative precision.
     The outhouse's laminated-sign/fake-queue rework was still judged
     "over the top" on a second pass — the theme was right, the
     execution was still a prop bolted onto the scene rather than an
     actual system being depicted. Match `perpetualRequisitionSlip`
     (`loot.ts`), not the outhouse's own laminated sign.
  3. *Social awkwardness / decorum under pressure* — characters
     performing calm, politeness, or conformity at any cost while
     something is clearly wrong (both the squirrel standoff and the
     outhouse occupant's insistence on a queue that doesn't exist).
- **Named characters (genie, squirrel, occupant, …) are their own thing**
  — distinct from the four house voices (zone descriptions, item flavor,
  narrator, journal/protagonist). Persona here is deliberately *not*
  specified in advance: write a batch of lines for a character, expect
  some to get culled, and let the voice emerge from what survives rather
  than trying to nail it in one pass. See [[content-iteration-process]] —
  don't over-defend a line once it gets a negative reaction; that
  reaction is signal about the target voice, not a one-off rejection.
- **Reference register for these lines: classical Divinity/Baldur's
  Gate-style companion dialogue.** Each character should read (and be
  hearable) as a distinct persona — accent, dialect, cadence, register —
  the way a BG companion is unmistakable from their lines alone with no
  speaker tag. That's the target *even though* nothing here is voice
  acted; the prose itself has to carry the performance.
- **A `say` line for a named character is the performance, not the
  scene.** No stage direction or description folded into a character's
  own line ("she says, tail twitching" inside `genie`'s or `occupant`'s
  text) — that's the narrator's job, on its own `'say', speaker: 'narrator'`
  line. A character's line is only what they'd actually say out loud,
  in their own cadence. Compare `outhouse:knock`'s `occupant` lines
  (`'Occupied.'` / `'There is a queue.'` — clipped, entirely without
  self-narration) against the surrounding `narrator` lines that carry
  all the scene description — that split is the pattern, keep it that
  sharp.
- If the encounter touches established lore (zone mysteries, factions,
  named NPCs beyond a one-off POI), read `LORE.md` at the repo root
  first — [[lore-bible-reference]].

## Testing

Use the `run-p2-ts-svelte` skill to start the dev server and click
through the new encounter in-browser — POI placement, `when` gating, and
`uniqueId` one-shot behavior are all easy to get subtly wrong and worth
actually walking through rather than eyeballing the data.
