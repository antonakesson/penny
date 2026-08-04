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
  // effect, not a property of the effect itself. effect can be a list -
  // fired in order off the one click (see corkedBottle: summonGenie +
  // openCorkedBottle both happen the instant it's popped) - rather than
  // inventing a multi-sub-effect shape on EffectDef itself. Mirrors how a
  // dialog node already sequences multiple `{ kind: 'action' }` lines.
  action?: { effect: EffectId | readonly EffectId[]; consumes: boolean };
  // Raw modifiers, not an EffectId - a held bonus is just data, active
  // exactly while this item's count > 0 (see sumModifier()).
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
  // Same title, different "editions" - deliberately unhooked from every
  // TREASURE pool, reachable only via DevTools' "Add item" dropdown.
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
  // consumes: false - popping the cork just starts the conversation, it
  // doesn't spend the item outright. Both effects fire off this one click:
  // summonGenie launches the encounter, openCorkedBottle swaps this to
  // openedCorkedBottle in the same beat, so the bottle goes inert for as
  // long as the genie's out - a second click mid-conversation has no
  // `action` left to fire, which is what actually stops spam-clicking from
  // stacking duplicate genies (see openCorkedBottle/closeCorkedBottle/
  // spendGenieWish in effects.ts for the rest of the state machine).
  corkedBottle: {
    name: 'Corked Bottle',
    rarity: 'epic',
    flavor: 'Dusty. Corked. Heavier than it looks.',
    action: { effect: ['summonGenie', 'openCorkedBottle'], consumes: false },
  },
  // What corkedBottle becomes the instant it's clicked (openCorkedBottle) -
  // inert, no action, for as long as the genie encounter it launched is
  // still unresolved. Reverts back to corkedBottle if the wish is declined
  // (closeCorkedBottle, fired from genie:nevermind) or becomes the
  // permanent emptyCorkedBottle if the wish is spent (spendGenieWish).
  openedCorkedBottle: {
    name: 'Corked Bottle',
    rarity: 'epic',
    flavor: "Cork's out. Whatever's in there is already talking.",
  },
  // What corkedBottle becomes via ITEM_SUBSTITUTIONS once genieBottleFound
  // is set. No action - popping this one does nothing.
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
    passive: [{ stat: 'petDamage', value: 1 }],
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
  // Dev-only test item - absent from every TREASURE pool, reachable only
  // via DevTools' "Add item" dropdown.
  perpetualRequisitionSlip: {
    name: 'Requisition Slip for a Training Weight, Issued Once and Never Signed Back In',
    rarity: 'legendary',
    flavor:
      "The Quartermaster General's Office does not process returns retroactively. As far as the ledger is concerned, whoever holds this slip is still mid-drill on an exercise authorized in a fiscal year nobody can currently locate, and continues to draw the full-swing allowance assigned to active training - not a blessing, a clerical position the department has simply never revisited.",
    passive: [{ stat: 'damage', value: 10 }],
  },
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

// Sparse - most items are uncapped, including legendaries. Checked inside
// resolvePool() below, not post-hoc - a capped item is excluded from the
// roll itself, so a guaranteed pool still rerolls among what's left.
export const ITEM_CAP: Partial<Record<ItemId, number>> = {
  letterMissingCat: 1,
  letterGoatSituation: 1,
  letterTollNotice: 1,
  knottedTwineRing: 1,
};

// A drop that silently resolves to a different item once `when` is met -
// odds don't change, only what the winning slot becomes (see substitute()).
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
  // No 'nothing' entry - guaranteed find, not a roll.
  hastilyAbandonedCampDrops: { barelyUsedSketchbook: 1 },
  // No 'nothing' entry - always yields a letter; equal weights.
  letterDrops: { letterMissingCat: 1, letterGoatSituation: 1, letterTollNotice: 1 },

  // Utils
  misc: { eye: 1, unidentifiedHair: 1, knottedTwineRing: 1 },
  noobTreasure: { tarnishedRing: 4, bottledDejaVu: 1, fightingWoodlandCreaturesForDummies: 1, corkedBottle: 1 },
  // 1-in-1000 of the tusk roll, not a separate chance - same drop, just an
  // absurdly rare cut of it.
  tuskDrops: { tusk: 999, tuskOfTheUnvanquishedSwineLord: 1 },
};

// How many independent rolls a pool makes when entered, keyed by pool id.
// Absent = 1. Fully decoupled from TREASURE so plain pools need no wrapping.
const PICKS: Record<string, number> = {};

const MAX_TREASURE_DEPTH = 5;

function isItemId(key: string): key is ItemId {
  return key in ITEMS;
}

// isAtCap is supplied by the caller (engine.ts) - loot.ts stays state-blind.
// Capped items are excluded before the weighted pick, not filtered after.
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

// One independent resolve per pool id - substitute() runs last, over the
// final resolved ids, so it never affects what gets rolled or its odds.
export function resolveDropIds(dropTableIds: readonly string[], isAtCap: (id: ItemId) => boolean): ItemId[] {
  return dropTableIds.flatMap((poolId) => resolvePool(poolId, 0, isAtCap)).map(substitute);
}
