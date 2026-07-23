import type { Inventory } from '../types';

let inventory = $state<Inventory>({});

export function getInventory(): Inventory {
  return inventory;
}

export function addItem(id: string, qty: number) {
  inventory[id] = (inventory[id] ?? 0) + qty;
}

export function removeItem(id: string, qty: number) {
  const next = (inventory[id] ?? 0) - qty;
  if (next <= 0) {
    delete inventory[id];
  } else {
    inventory[id] = next;
  }
}

export function hydrateInventory(value: Inventory) {
  inventory = value;
}
