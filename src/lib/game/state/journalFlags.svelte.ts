import type { FlagId } from '../data/journalFlags';

// Bit assignments are fixed once used - a saved mask is only meaningful
// against the layout that wrote it.
const FLAG_BITS: Record<FlagId, bigint> = {
  genieWishGranted: 1n,
  genieBottleFound: 2n,
  soiledPants: 4n,
  breakingAndEnteringAndPooping: 8n,
};

let mask = $state<bigint>(0n);

export function setFlag(flag: FlagId) {
  mask |= FLAG_BITS[flag];
}

export function hasFlag(flag: FlagId): boolean {
  return (mask & FLAG_BITS[flag]) !== 0n;
}

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
