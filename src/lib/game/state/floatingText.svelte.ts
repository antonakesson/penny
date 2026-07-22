import type { FloatingTextEntry } from '../types';

const LIFETIME_MS = 2300;

// Loot text spawns a beat after damage text so a killing blow reads as
// "hit, then reward" instead of both landing on the same frame — purely
// a presentation choice, so callers just report the event and this module
// decides how it's staggered.
const LOOT_DELAY_MS = 250;

// Separate horizontal lanes per variant so a kill's damage number and its
// loot text (spawned from the same point, same moment) don't land on top
// of each other — damage drifts left, loot drifts right.
const LANE_CENTER: Record<FloatingTextEntry['variant'], number> = {
  damage: -40,
  loot: 40,
};

let entries = $state<FloatingTextEntry[]>([]);
let nextId = 1;

export function getFloatingTexts(): FloatingTextEntry[] {
  return entries;
}

export function spawnFloatingText(text: string, variant: FloatingTextEntry['variant']) {
  const id = nextId++;
  const offset = LANE_CENTER[variant] + (Math.random() - 0.5) * 20;
  entries.push({ id, text, variant, offset });
  setTimeout(() => {
    entries = entries.filter((entry) => entry.id !== id);
  }, LIFETIME_MS);
}

export function spawnLootText(text: string) {
  setTimeout(() => spawnFloatingText(text, 'loot'), LOOT_DELAY_MS);
}
