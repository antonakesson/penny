import type { FloatingTextEntry } from '../types';
import type { Rarity } from '../data/loot';

const LIFETIME_MS = 2300;

// Loot text spawns a beat after damage text so a kill reads as "hit, then
// reward" instead of both landing on the same frame.
const LOOT_DELAY_MS = 250;

// Separate horizontal lanes so damage and loot text don't land on top of
// each other - damage drifts left, loot drifts right.
const LANE_CENTER: Record<FloatingTextEntry['variant'], number> = {
  damage: -40,
  loot: 40,
};

let entries = $state<FloatingTextEntry[]>([]);
let nextId = 1;

export function getFloatingTexts(): FloatingTextEntry[] {
  return entries;
}

export function spawnFloatingText(text: string, variant: FloatingTextEntry['variant'], rarity?: Rarity) {
  const id = nextId++;
  const offset = LANE_CENTER[variant] + (Math.random() - 0.5) * 20;
  entries.push({ id, text, variant, offset, rarity });
  setTimeout(() => {
    entries = entries.filter((entry) => entry.id !== id);
  }, LIFETIME_MS);
}

export function spawnLootText(text: string, rarity: Rarity) {
  setTimeout(() => spawnFloatingText(text, 'loot', rarity), LOOT_DELAY_MS);
}
