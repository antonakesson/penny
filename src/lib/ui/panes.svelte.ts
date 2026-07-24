export const PANES = {
  inventory: { label: 'Inventory' },
  settings: { label: 'Settings' },
} as const;

export type PaneId = keyof typeof PANES;

// Nav placeholders for systems that don't exist yet — disabled, no pane
// content behind them. Promote an entry to PANES once its system lands.
export const PLANNED_PANES = ['Stash', 'Quests'] as const;

let activePane = $state<PaneId | null>(null);

export function getActivePane(): PaneId | null {
  return activePane;
}

export function togglePane(paneId: PaneId) {
  activePane = activePane === paneId ? null : paneId;
}
