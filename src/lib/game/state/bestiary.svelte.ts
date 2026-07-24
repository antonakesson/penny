// Discovery is a bitmask keyed by entryNo (bit 0 = entryNo 1, etc.), not a
// set of id strings — entryNo is already a dense, stable integer, and
// combat encounters discover monsters in random order, so a bitmask stays
// compact regardless of how many entries exist, where a growing list of
// raw id strings wouldn't.
let discoveredMask = $state<bigint>(0n);

export function isDiscovered(entryNo: number): boolean {
  return (discoveredMask & (1n << BigInt(entryNo - 1))) !== 0n;
}

// Highest entryNo discovered so far — doubles as "how many rows to render"
// for a list that only grows up to the latest discovery.
export function getMaxDiscoveredEntryNo(): number {
  let mask = discoveredMask;
  let n = 0;
  while (mask > 0n) {
    n++;
    mask >>= 1n;
  }
  return n;
}

// Marks a monster discovered on first kill; no-ops on repeat kills.
export function discoverMonster(entryNo: number) {
  discoveredMask |= 1n << BigInt(entryNo - 1);
}

export function serializeDiscoveredMonsters(): string {
  return discoveredMask.toString(16);
}

export function hydrateDiscoveredMonsters(hex: string) {
  discoveredMask = hex ? BigInt('0x' + hex) : 0n;
}
