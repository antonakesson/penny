import { weightedPick } from '../util/weighted';
import type { ItemActionId } from './itemActions';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemDef = { name: string; rarity: Rarity; flavor?: string; action?: ItemActionId };

export const ITEMS = {
  tusk: { name: 'Boar Tusk', rarity: 'common' },
  honeycomb: { name: 'Honeycomb', rarity: 'common' },
  badgerClaw: { name: 'Badger Claw', rarity: 'common' },
  eye: { name: 'Eye', rarity: 'common' },
  unidentifiedHair: { name: 'Unidentified Hair', rarity: 'common' },
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
  },
  thorn: { name: 'Thorn', rarity: 'common', flavor: 'Not worth the epidermal inconvenience.' },
  twig: { name: 'Twig', rarity: 'common', flavor: 'You really could have just walked around it.' },
  wormEatenJournal: {
    name: 'Worm-Eaten Journal',
    rarity: 'rare',
    flavor: 'Waterlogged pages, but the sketches are still legible. Someone was keeping notes on everything out here.',
    action: 'unlockBestiary',
  },
  bottledDejaVu: {
    name: 'Bottled Déjà Vu',
    rarity: 'rare',
    flavor: "You've been here before. You're about to be here again.",
    action: 'freezeSpawn',
  },
  tuskOfTheUnvanquishedSwineLord: {
    name: 'Tusk of the Unvanquished Swine-Lord, Who Only Ever Stood Here, In This Field, Doing Nothing',
    rarity: 'legendary',
    flavor:
      'Wrenched, with some difficulty and a great deal of swearing, from a boar that had — up until this point — never left a three-metre radius of grass. Scholars remain divided on whether this constitutes a quest.',
  },
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

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
  // No 'nothing' entry — the camp is a guaranteed find, not a roll. Sole
  // source of wormEatenJournal; it used to also trickle out of noobTreasure,
  // pulled once the camp existed so the Bestiary unlock reads as "you found
  // the camp" rather than "you got lucky killing a boar."
  hastilyAbandonedCampDrops: { wormEatenJournal: 1 },

  // Utils
  misc: { eye: 1, unidentifiedHair: 1, knottedTwineRing: 1 },
  noobTreasure: { tarnishedRing: 4, bottledDejaVu: 1 },
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

function resolvePool(poolId: string, depth: number): ItemId[] {
  if (depth >= MAX_TREASURE_DEPTH) return [];
  const pool = TREASURE[poolId];
  if (!pool) return [];
  const picks = PICKS[poolId] ?? 1;
  const drops: ItemId[] = [];
  for (let i = 0; i < picks; i++) {
    const key = weightedPick(Object.entries(pool));
    if (key === 'nothing') continue;
    if (isItemId(key)) drops.push(key);
    else drops.push(...resolvePool(key, depth + 1));
  }
  return drops;
}

// One independent resolve per pool id — a monster with the same pool listed
// twice gets two separate chances, not a guaranteed pair.
export function resolveDropIds(dropTableIds: readonly string[]): ItemId[] {
  return dropTableIds.flatMap((poolId) => resolvePool(poolId, 0));
}
