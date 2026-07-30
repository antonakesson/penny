# Act 1 — Storyline Reference

Living reference doc, not a one-off implementation plan (contrast
`FEATURE_EQUIPMENT.md`) — this persists as the story bible for Act 1 and
gets updated as the arc develops, rather than deleted once "done."

## The golden rule

**Only ever hinted, never explained.** No page, dialogue, or event is
allowed to state the resolution outright. The player assembles it from
disconnected fragments that never touch each other in-fiction; nothing
in-world ever says the quiet part out loud. Same technique already used
for the Knotted Twine Ring (`"Too small for a wrist. Too big for a
finger."` — never says whose, never says why) — this is that same move,
run at the scale of a whole act instead of one item. If a draft of any
page/event/quote ever explains the mystery instead of gesturing at it,
that draft is wrong regardless of how "clear" it is — clarity is not the
goal here.

## The question

Cobb Thistlewood's quote (already in the game, zone1's description) plants
it on day one: *"If you don't count the people who don't come back, the
forest is 100% safe."* Act 1 answers: why do adventurers not come back?

## The answer (never stated in-fiction)

They don't come back because they got lost following bad maps, and where
they ended up was better than where they meant to go, so they stayed.
Nobody's dead. Nobody's trapped. Nobody's a villain.

- **Jimothy** — a weekend-cartographer, hobbyist, not a professional and
  not malicious. He redraws terrain for aesthetics, not accuracy, and is
  completely sincere about it: *"the river looks better this way,"* *"I
  had to move the village."* Total, unblinking confidence in maps that
  are quietly wrong. Never portrayed as a threat or a fool being punished
  — just an artist whose medium happens to get people lost.
  - Two-axis characterization: genuinely talented artist (the sketches
    are good — this is why his sketchbook can carry real illustration,
    not a joke-bad doodle) crossed with a genuinely hopeless
    survivalist/explorer/cartographer. The maps are beautiful *and*
    wrong for the same underlying reason: he trusts his eye over the
    terrain. Comedy comes from the mismatch between competence and
    domain, not from mocking him — same "total sincerity" rule as the
    map quotes above.
  - Carries two separate physical artifacts, not one — see "Delivery
    mechanisms" below: a sketchbook/proto-bestiary (found whole at the
    camp) and a personal diary (found in pieces, scattered across all
    three zones). Different object, different find-condition, different
    voice register.
- Adventurers who trusted his maps didn't die or get monster-mauled —
  they just ended up somewhere else entirely. That somewhere is a real,
  pleasant, hidden village (working name **New Fivemarsh** — they were
  making for "Fivemarsh," ended up nowhere near it, kept the name anyway,
  completely straight-faced — same shape of joke as real colonial place-
  naming, delivered with zero wink). Fishing, crafting, pipe-smoke.
  Nobody there wants rescuing. Nobody there thinks of themselves as lost.
- This makes Cobb's quote **retroactively, literally true**: the people
  who don't come back are fine. Better than fine. The joke is that the
  ominous-sounding opening line was accurate the whole time, just not in
  the way it read.

## The thread that does NOT resolve in Act 1

*"The trees are screaming at night."* A real, separate, unrelated dread
hint — delivered completely deadpan by whichever voice mentions it, who
never connects it to anything (not to the missing adventurers, not to
each other). Two problems of very different scale coexist and nothing
in-fiction notices both at once. This stays open on purpose, seeding
Act 2. Do not let it get pulled into the missing-adventurers resolution
even accidentally — they are not the same mystery.

## Delivery mechanisms

- **The camp** (built) — `hastilyAbandonedCamp`, one-shot event
  (`state/events.svelte.ts`), investigate-kind. Found item is Jimothy's
  own sketchbook/proto-bestiary — whole, not torn, just barely started:
  one finished page (a genuinely skillful Boar) and blank pages after
  it, because he had to flee before filling in more. Not damage, just
  interruption — that's the mystery hook ("why did he stop"), not a
  ruined artifact. This is the diegetic reason the player's own Bestiary
  exists and starts non-empty. Item is `barelyUsedSketchbook` (existing,
  renamed from `wormEatenJournal` — "journal" now collides with the diary
  below, and "worm-eaten" undersold what it actually is: fresh, bought for
  this trip, one page in). No torn-out pages; the Boar page and the blanks
  after it are both intact. Breadcrumb that introduces the Jimothy hook;
  the diary below is the separate object
  that actually gets torn apart.
- **Journal pages** (not built) — Jimothy's personal diary, a *different*
  object from the camp's sketchbook: found in pieces, dropped from the
  *normal* loot pool across all three zones (not gated to one event),
  using a new `unique` flag on `ItemDef` (`loot.ts`) so each page can
  only ever be obtained once (resolves to a whiff if already owned, per
  `resolveDropIds()`). Pickup order is incidental — a future
  Journal/Codex screen displays collected pages in fixed canonical
  (story) order regardless of the order they actually dropped in, the
  same way a sticker album works. Day-numbered, first-person, misspelled
  in character (not proofread — written by someone who thinks he's
  fine), e.g.: *"Day 2. The chafing is unbearable. The hair is of VITAL
  importans. Both as a cusion and for heat disipation."* Pure Jimothy
  characterization early, never touching the mystery directly; later
  pages get closer to the edge of the reveal without ever crossing it.
- **Mystery-event pool** (not built) — code-driven, state-dependent
  triggers (distance/zone gated) for atmosphere beats like the
  tree-screaming hint, reusing the same `events.svelte.ts` pattern the
  camp already established. Distinguishing feature from a normal zone
  table entry: the trigger needs to reference game state a flat weight
  table can't express.
- **Act 1 climax event** (not built) — a level-~10 milestone: stumbling
  onto the village itself. Investigate-kind (a discovery, not a fight),
  same "hint, don't explain" rule applies at full force here — the
  description gestures at contentment and coincidence, never spells out
  "these are the missing adventurers."

## Zone / level map

| Zone | Level band | Monster pool | Status |
|---|---|---|---|
| Whispering Woods (`zone1`) | 0–4 | existing 4 | Built. Cobb's quote lives here. |
| *Rainbow Bog* (placeholder name) | 4–6 | subset of the 11 already-authored level-2 stubs (`monstats.ts` entryNo 5–15) | Not built — no `ZONES` entry, no zone-transition logic exists at all (`zone.svelte.ts` is hardcoded to `zone1` permanently). |
| *The Last Ledger* (placeholder name) | 6–8 | remaining level-2 stubs, possibly some new ones | Not built, same gap. |
| Possible finale / RP / grind event | 9–10 | TBD | Not decided — may not be a zone at all, could be the climax event itself. |

Placeholder zone names need their own Codex-voice naming pass (like
Whispering Woods got) before they're final — not locked in yet.

## Zone dumps

### Whispering Woods (`zone1`) — built

> The trees are evenly distributed. And strangely, equally tall, as if
> guided by some cost-benefit analysis of structural integrity versus
> sunlight yield. Adventurers who linger report a profound sense of
> purpose, followed shortly by a normal sense of purpose.

Quote: *"If you don't count the people who don't come back, the forest
is 100% safe."* — Cobb Thistlewood, Ranger / Coroner

| Monster | Weight | Level | HP | XP |
|---|---|---|---|---|
| Thorny Shrubbery | 8 | 1 | 8 | 3 |
| Boar | 10 | 1 | 5 | 2 |
| Honeybee | 1 | 1 | 2 | 8 |
| Badger | 15 | 1 | 3 | 1 |

Order is load-bearing (see comment in `zones.ts`) — array position maps
to a signal band, low to high: Thorny Shrubbery (wet valley floor) →
Boar → Honeybee (narrow transition marker) → Badger (high ground).

### Rainbow Bog (`zone2`) — data wired, not reachable in-game

`ZONES` entry exists with name/description/quote/weights (all marked
`DRAFT` in `zones.ts` — first-pass, not a locked naming/voice pass).
Wetland-themed half of the 11 level-2 stubs. Ordered shore-to-dryland,
same load-bearing-order convention as zone1.

| Monster | Weight | Level | HP | XP |
|---|---|---|---|---|
| Watersnake | 12 | 2 | 4 | 2 |
| Deceptive Mound (Looking Solid But Was Actually Wet Feet) | 4 | 2 | 3 | 7 |
| Duck. Just a Duck. | 14 | 2 | 2 | 1 |
| Moose | 6 | 2 | 12 | 4 |
| Blueberry | 5 | 2 | 6 | 6 |
| Feral Goat | 9 | 2 | 5 | 2 |
| Fox | 9 | 2 | 5 | 2 |

### The Last Ledger (`zone3`) — data wired, not reachable in-game

Same status as Rainbow Bog: `ZONES` entry exists, `DRAFT` flavor.
Bureaucracy/property-dispute theme, built around the four stubs that
already read as ownership satire. Ordered by seniority: squatter →
enforcer → organization → authority.

| Monster | Weight | Level | HP | XP |
|---|---|---|---|---|
| Guy Who Definitely Owns This Now | 10 | 2 | 6 | 3 |
| Ruffian | 12 | 2 | 10 | 4 |
| Suspiciously Organized Rat King | 3 | 2 | 14 | 9 |
| The Auditor | 2 | 2 | 9 | 9 |

Neither zone is reachable in-game yet — `zone.svelte.ts` is still
hardcoded to `zone1` permanently, no zone-transition logic exists at
all (see "Not yet built" below).

## Open questions (not yet decided)

1. Real names for the two unbuilt zones.
2. Village name — leaning **New Fivemarsh**, not locked.
3. Journal page count (affects how thin/thick each beat needs to be).
4. Zone transition trigger — distance-within-zone, level, or both.
5. Exact wording of the climax event and how late/early the "Fivemarsh"
   name should be seeded in earlier journal pages (so the climax lands
   as recognition, not a cold reveal).
6. Whether the sketchbook has a visible cover/title, and — if so — whether
   it's the first place his name (or an oblique fragment of it) ever
   appears in-fiction, vs. staying anonymous until a later, deliberate
   reveal beat.

## Not yet built (technical prerequisites, tracked here for visibility)

- `unique` flag on `ItemDef` + the `resolveDropIds()` check for it.
- Zone-transition logic in `zone.svelte.ts` (currently doesn't exist).
- `rainbowBog`/`theLastLedger` as real `ZONES` entries with monster
  tables, descriptions, and quotes (matching zone1's shape).
- The mystery-event pool's actual first entries.
- The Act 1 climax event itself.
