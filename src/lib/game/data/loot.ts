import { weightedPick } from '../util/weighted';
import type { EffectId } from './effects';
import type { Modifier } from './modifiers';
import type { Condition } from './condition';
import { evaluateCondition } from '../condition';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemDef = {
  name: string;
  rarity: Rarity;
  flavor?: string;
  // consumes lives here, not on EffectDef - it's how *this item* uses the
  // effect (read-and-discarded vs. held), not a property of the effect
  // itself. A future non-item source (a camp passively granting a flavor
  // effect, an onHit debuff) reads the same EffectId with no consumption
  // concept attached at all.
  action?: { effect: EffectId; consumes: boolean };
  // Raw modifiers, not an EffectId - a held bonus is just data (no
  // trigger, no title of its own), unlike `action` which references a
  // named, shared, elsewhere-triggerable behavior. Exists exactly while
  // this item's count > 0 - see sumModifier() in state/modifier.svelte.ts.
  passive?: readonly Modifier[];
};

export const ITEMS = {
  tusk: { name: 'Boar Tusk', rarity: 'common' },
  honeycomb: { name: 'Honeycomb', rarity: 'common' },
  badgerClaw: { name: 'Badger Claw', rarity: 'common' },
  eye: { name: 'Eye', rarity: 'common' },
  unidentifiedHair: { name: 'Unidentified Hair', rarity: 'common' },
  fishScale: { name: 'Fish Scale', rarity: 'common' },
  rustyHook: {
    name: 'Rusty Hook',
    rarity: 'common',
    flavor: 'Never caught anything. Possibly not for lack of trying.',
  },
  knottedTwineRing: {
    name: 'Knotted Twine Ring',
    rarity: 'uncommon',
    flavor: 'Too small for a wrist. Too big for a finger.',
  },
  tarnishedRing: {
    name: 'Tarnished Ring',
    rarity: 'uncommon',
    flavor: "A ring, tarnished from years on someone else's hand.",
  },
  chicken: {
    name: '"Chicken"',
    rarity: 'common',
    flavor: 'Best not to ask.',
    action: { effect: 'eatChicken', consumes: true },
  },
  thorn: { name: 'Thorn', rarity: 'common', flavor: 'Not worth the epidermal inconvenience.' },
  twig: { name: 'Twig', rarity: 'common', flavor: 'You really could have just walked around it.' },
  barelyUsedSketchbook: {
    name: 'Barely-Used Sketchbook',
    rarity: 'rare',
    flavor: 'One boar in, and already abandoned.',
    action: { effect: 'unlockJournal', consumes: true },
  },
  bottledDejaVu: {
    name: 'Bottled Déjà Vu',
    rarity: 'rare',
    flavor: "You've been here before. You're about to be here again.",
    action: { effect: 'freezeSpawn', consumes: true },
  },
  fightingWoodlandCreaturesForDummies: {
    name: 'Fighting Woodland Creatures for Dummies',
    rarity: 'rare',
    flavor:
      'Less a guide, more a very detailed daydream. The author has illustrated himself defeating a badger in fourteen increasingly implausible outfits.',
    action: { effect: 'permanentDamageBoost', consumes: true },
  },
  // Same generic title, wildly inconsistent actual contents — the joke being
  // that plenty of people apparently tried to write THE definitive guide to
  // fighting woodland creatures, and none of them agree, or are remotely
  // qualified. Only the entry above is listed in noobTreasure; these three
  // are written but deliberately unhooked from every TREASURE pool for now
  // (same pattern as perpetualRequisitionSlip below) - reachable only via
  // DevTools' "Add item" dropdown. Candidates for a future dedicated pool
  // that rolls among all four "editions" instead of always handing out the
  // same one.
  fightingWoodlandCreaturesForDummiesTreatise: {
    name: 'Fighting Woodland Creatures for Dummies',
    rarity: 'rare',
    flavor:
      'Four hundred rigorously footnoted pages. Chapter Eleven concerns what to do if the badger has unionized. It is not the joke chapter it sounds like.',
    action: { effect: 'permanentDamageBoost', consumes: true },
  },
  fightingWoodlandCreaturesForDummiesScholar: {
    name: 'Fighting Woodland Creatures for Dummies',
    rarity: 'rare',
    flavor: 'Written by a man who has never once set foot outside his reading room, with the complete confidence of someone who has.',
    action: { effect: 'permanentDamageBoost', consumes: true },
  },
  fightingWoodlandCreaturesForDummiesClickbait: {
    name: 'Fighting Woodland Creatures for Dummies',
    rarity: 'rare',
    flavor: "You Won't Believe What Happened When One Man Challenged a Badger to Single Combat (Foresters Hate Him).",
    action: { effect: 'permanentDamageBoost', consumes: true },
  },
  corkedBottle: {
    name: 'Corked Bottle',
    rarity: 'epic',
    flavor: 'Dusty. Corked. Heavier than it looks.',
    action: { effect: 'summonGenie', consumes: true },
  },
  // What corkedBottle silently becomes once ITEM_SUBSTITUTIONS' genieBottleFound
  // flag is set - one genie, ever, so every roll after the first is just a
  // bottle. No action - popping this one was never going to do anything.
  emptyCorkedBottle: {
    name: 'Corked Bottle',
    rarity: 'common',
    flavor: "Corked, same as the last one. Whatever was in that one, it wasn't in here.",
  },
  wishAsIs: {
    name: 'Wish (As-Is)',
    rarity: 'rare',
    flavor: 'No refunds. No exchanges. Works as described, allegedly.',
    passive: [{ stat: 'damage', value: 1 }],
  },
  lifetimeAcorns: {
    name: 'Lifetime Supply of Acorns',
    rarity: 'rare',
    flavor: 'The genie did not specify a unit. This was, in retrospect, a mistake.',
  },
  tuskOfTheUnvanquishedSwineLord: {
    name: 'Tusk of the Unvanquished Swine-Lord, Who Only Ever Stood Here, In This Field, Doing Nothing',
    rarity: 'legendary',
    flavor:
      'Wrenched, with some difficulty and a great deal of swearing, from a boar that had — up until this point — never left a three-metre radius of grass. Scholars remain divided on whether this constitutes a quest.',
  },
  letterMissingCat: {
    name: 'Undelivered Letter',
    rarity: 'common',
    flavor:
      "Gwendolyn's cat has been missing since last Monday. If seen, do not approach — he bites. Also, if seen, please tell him we're not mad.",
  },
  letterGoatSituation: {
    name: 'Undelivered Letter',
    rarity: 'common',
    flavor: "Dearest Cousin — the goat situation has NOT improved. I don't want to talk about it further in writing. Come get your goat.",
  },
  letterTollNotice: {
    name: 'Notice',
    rarity: 'common',
    flavor:
      "NOTICE: Toll bridge fee has increased to two (2) coppers — or other arrangements — effective immediately, due to 'ongoing structural feelings.' No refunds.",
  },
  // Dev-only test tool — deliberately absent from every TREASURE pool, so
  // the only way into an inventory is DevTools' "Add item" dropdown (which
  // lists every ITEMS key unconditionally, no separate wiring needed). The
  // +10 damage is a passive modifier - held, not used - see sumModifier()
  // in state/modifier.svelte.ts.
  perpetualRequisitionSlip: {
    name: 'Requisition Slip for a Training Weight, Issued Once and Never Signed Back In',
    rarity: 'legendary',
    flavor:
      "The Quartermaster General's Office does not process returns retroactively. As far as the ledger is concerned, whoever holds this slip is still mid-drill on an exercise authorized in a fiscal year nobody can currently locate, and continues to draw the full-swing allowance assigned to active training - not a blessing, a clerical position the department has simply never revisited.",
    passive: [{ stat: 'damage', value: 10 }],
  },
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

// Sparse - most items have no cap at all (unbounded stacking; notably NOT
// tuskOfTheUnvanquishedSwineLord - a second one is funnier, not a bug, and
// honors the ~1-in-5000 grind behind the first). What "unique" means here
// is a specific narrative object (a specific missing cat's owner's letter,
// a specific crudely-carved ring) - most legendary items still stack fine.
// Checked inside resolvePool() below, not post-hoc in engine.ts - a capped
// item gets excluded from the roll itself, not rolled-then-denied, so a
// guaranteed pool (letterDrops has no 'nothing') rerolls among what's left
// instead of occasionally handing back nothing at all.
export const ITEM_CAP: Partial<Record<ItemId, number>> = {
  letterMissingCat: 1,
  letterGoatSituation: 1,
  letterTollNotice: 1,
  knottedTwineRing: 1,
};

// A one-time-ever drop that silently becomes a different (usually inert)
// item once its condition is met - the roll's odds don't change, only what
// the winning slot resolves to, so this is a plain post-resolution rewrite
// (see substitute() below), not a pre-roll exclusion like ITEM_CAP above
// (which changes the odds among what's left). `when` is the same shared
// Condition every other gate reads (evaluateCondition, imported directly -
// a plain cross-domain read, same tier isFeatureUnlocked/hasFlag already
// got read at from outside engine.ts, unlike ITEM_CAP's isAtCap, which
// stays an injected callback because it's reading live inventory state
// instead). Was flag-only; widened to Condition so a future substitution
// can gate on hasItem/hasFeature too without a second table.
export const ITEM_SUBSTITUTIONS: Partial<Record<ItemId, { when: Condition; fallback: ItemId }>> = {
  corkedBottle: { when: { kind: 'flag', flag: 'genieBottleFound' }, fallback: 'emptyCorkedBottle' },
};

function substitute(id: ItemId): ItemId {
  const sub = ITEM_SUBSTITUTIONS[id];
  return sub && evaluateCondition(sub.when) ? sub.fallback : id;
}

export const RARITY_ORDER: readonly Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

type DropPool = Record<string, number>;

// Keys are either an ItemId (leaf drop), 'nothing' (no-drop weight), or the
// name of another pool below to recurse into — same shape as D2's TreasureClassEx.
const TREASURE: Record<string, DropPool> = {

  // Entries
  boarDrops: { nothing: 15, tuskDrops: 6, chicken: 6, misc: 2, noobTreasure: 1 },
  honeybeeDrops: { nothing: 9, honeycomb: 6, misc: 2, noobTreasure: 1 },
  badgerDrops: { nothing: 15, badgerClaw: 6, chicken: 6, misc: 2, noobTreasure: 1 },
  shrubberyDrops: { nothing: 15, thorn: 6, twig: 6, misc: 2, noobTreasure: 1 },
  fishDrops: { nothing: 15, fishScale: 4, chicken: 6, misc: 2, noobTreasure: 1, rustyHook: 1 },
  // No 'nothing' entry — the camp is a guaranteed find, not a roll. Sole
  // source of barelyUsedSketchbook; it used to also trickle out of
  // noobTreasure, pulled once the camp existed so the Journal unlock reads
  // as "you found the camp" rather than "you got lucky killing a boar."
  hastilyAbandonedCampDrops: { barelyUsedSketchbook: 1 },
  // No 'nothing' entry — the rabbit hole always yields a letter (the joke is
  // that it's huge unnecessary intel, not that it's rare). Equal weights: no
  // one letter is "the" reveal.
  letterDrops: { letterMissingCat: 1, letterGoatSituation: 1, letterTollNotice: 1 },

  // Utils
  misc: { eye: 1, unidentifiedHair: 1, knottedTwineRing: 1 },
  noobTreasure: { tarnishedRing: 4, bottledDejaVu: 1, fightingWoodlandCreaturesForDummies: 1, corkedBottle: 1 },
  // 1-in-1000 of the tusk roll, not a separate chance — the legendary tusk
  // is the same drop, just an absurdly rare cut of it, not a new category.
  // Was 1-in-100 (~1-in-500 per boar kill, median ~350 boars) - measured
  // that against real play and it dropped inside "a few hundred boars,"
  // under an hour, which reads as common, not legendary. 10x'd to land
  // ~1-in-5000 per boar kill (median ~3,500 boars) - a real grind.
  tuskDrops: { tusk: 999, tuskOfTheUnvanquishedSwineLord: 1 },
};

// How many independent rolls a pool makes when entered, keyed by pool id.
// Absent = 1. Fully decoupled from TREASURE so plain pools need no wrapping.
const PICKS: Record<string, number> = {};

const MAX_TREASURE_DEPTH = 5;

function isItemId(key: string): key is ItemId {
  return key in ITEMS;
}

// isAtCap is supplied by the caller (engine.ts), not read here - loot.ts
// stays state-blind (see architecture_state_ownership: cross-domain
// composition lives only in engine.ts). Capped-out items are excluded
// before the weighted pick, not filtered after it - see ITEM_CAP's comment
// on why a guaranteed pool needs the exclusion to happen pre-roll.
function resolvePool(poolId: string, depth: number, isAtCap: (id: ItemId) => boolean): ItemId[] {
  if (depth >= MAX_TREASURE_DEPTH) return [];
  const pool = TREASURE[poolId];
  if (!pool) return [];
  const picks = PICKS[poolId] ?? 1;
  const drops: ItemId[] = [];
  for (let i = 0; i < picks; i++) {
    const available = Object.entries(pool).filter(([key]) => !isItemId(key) || !isAtCap(key));
    if (available.length === 0) continue; // everything left in this pool is capped out
    const key = weightedPick(available);
    if (key === 'nothing') continue;
    if (isItemId(key)) drops.push(key);
    else drops.push(...resolvePool(key, depth + 1, isAtCap));
  }
  return drops;
}

// One independent resolve per pool id — a monster with the same pool listed
// twice gets two separate chances, not a guaranteed pair. substitute() runs
// last, over the final resolved ids - it never affects what gets rolled or
// its odds, only what a winning corkedBottle roll actually turns into.
export function resolveDropIds(dropTableIds: readonly string[], isAtCap: (id: ItemId) => boolean): ItemId[] {
  return dropTableIds.flatMap((poolId) => resolvePool(poolId, 0, isAtCap)).map(substitute);
}
