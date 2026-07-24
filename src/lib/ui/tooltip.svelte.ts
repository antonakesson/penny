import type { ItemId } from '../game/data/loot';

export interface TooltipRequest {
  itemId: ItemId;
  rect: DOMRect;
}

let current = $state<TooltipRequest | null>(null);

export function getTooltip(): TooltipRequest | null {
  return current;
}

export function showTooltip(itemId: ItemId, rect: DOMRect) {
  current = { itemId, rect };
}

export function hideTooltip() {
  current = null;
}
