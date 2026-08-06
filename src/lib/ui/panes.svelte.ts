import { isFeatureUnlocked } from '../game/game';
import type { FeatureId } from '../game/data/features';

export const PANES = {
  character: { label: 'Character' },
  skills: { label: 'Skills' },
  inventory: { label: 'Inventory' },
  journal: { label: 'Journal' },
  pet: { label: 'Pet' },
  settings: { label: 'Settings' },
  devtools: { label: 'Dev Tools' },
} as const;

export type PaneId = keyof typeof PANES;

// Panes gated behind a feature unlock - absent from the nav until earned.
const PANE_GATE: Partial<Record<PaneId, FeatureId>> = {
  journal: 'journal',
  pet: 'pet',
};

export function isPaneVisible(paneId: PaneId): boolean {
  // Environment gate, not a progression unlock - stripped from prod builds.
  if (paneId === 'devtools') return import.meta.env.DEV;
  const gate = PANE_GATE[paneId];
  return gate === undefined || isFeatureUnlocked(gate);
}

const PINNED_STORAGE_KEY = 'idle-game:pinned-panes';

function isPaneId(value: unknown): value is PaneId {
  return typeof value === 'string' && value in PANES;
}

function loadPinned(): PaneId[] {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isPaneId) : [];
  } catch {
    return [];
  }
}

function savePinned(pinned: PaneId[]) {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinned));
  } catch {
    // Storage unavailable — pin state just won't survive a reload.
  }
}

let activePane = $state<PaneId | null>(null);
// Order doubles as dock order. UI preference, not game state - kept out of
// save.ts.
let pinnedPanes = $state<PaneId[]>(loadPinned());

export function getActivePane(): PaneId | null {
  return activePane;
}

export function isPinned(paneId: PaneId): boolean {
  return pinnedPanes.includes(paneId);
}

export function getPinOrder(paneId: PaneId): number {
  return pinnedPanes.indexOf(paneId);
}

export function togglePane(paneId: PaneId) {
  activePane = activePane === paneId ? null : paneId;
}

export function togglePin(paneId: PaneId) {
  pinnedPanes = pinnedPanes.includes(paneId) ? pinnedPanes.filter((id) => id !== paneId) : [...pinnedPanes, paneId];
  savePinned(pinnedPanes);
}
