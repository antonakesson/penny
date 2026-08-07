import type { FlagId } from '../data/journalFlags';

// Bit assignments are fixed once used - a saved mask is only meaningful
// against the layout that wrote it. 4n/8n retired with the outhouse
// encounter (soiledPants/breakingAndEnteringAndPooping) - don't recycle
// them onto a new flag, an old save could still carry those bits set.
const FLAG_BITS: Record<FlagId, bigint> = {
  genieWishGranted: 1n,
  genieBottleFound: 2n,
  lingered: 16n,
  broarSlain: 32n,
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
