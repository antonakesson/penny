import type { FlagId } from '../data/journalFlags';

// Bit assignments are fixed once used (not reassigned/reordered) - a saved
// mask is only meaningful against the bit layout that wrote it. Same trick
// as events.svelte.ts's firedMask, generalized past just spawn-gating: any
// call site can flip a bit, not only the spawn table.
const FLAG_BITS: Record<FlagId, bigint> = {
  genieWishGranted: 1n,
  genieBottleFound: 2n,
};

let mask = $state<bigint>(0n);

export function setFlag(flag: FlagId) {
  mask |= FLAG_BITS[flag];
}

export function hasFlag(flag: FlagId): boolean {
  return (mask & FLAG_BITS[flag]) !== 0n;
}

// DevTools' flag list reads this instead of iterating FlagId itself -
// FLAG_BITS is already the exhaustive per-flag record, no separate list to
// keep in sync with it.
export function getAllFlags(): Record<FlagId, boolean> {
  return Object.fromEntries((Object.keys(FLAG_BITS) as FlagId[]).map((flag) => [flag, hasFlag(flag)])) as Record<
    FlagId,
    boolean
  >;
}

export function serializeFlags(): string {
  return mask.toString(16);
}

export function hydrateFlags(hex: string) {
  mask = hex ? BigInt('0x' + hex) : 0n;
}
