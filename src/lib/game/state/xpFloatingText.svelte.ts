// Separate from floatingText.svelte.ts on purpose - that layer is anchored
// over the monster (mounted once, in Encounter.svelte); this one is anchored
// over the Character pane's XP bar, a different spot in the tree entirely.
const LIFETIME_MS = 1800;

export interface XpFloatingTextEntry {
  id: number;
  text: string;
}

let entries = $state<XpFloatingTextEntry[]>([]);
let nextId = 1;

export function getXpFloatingTexts(): XpFloatingTextEntry[] {
  return entries;
}

export function spawnXpFloatingText(amount: number) {
  const id = nextId++;
  entries.push({ id, text: `+${amount} XP` });
  setTimeout(() => {
    entries = entries.filter((entry) => entry.id !== id);
  }, LIFETIME_MS);
}
