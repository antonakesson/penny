export interface ItemActionDef {
  description: string;
  // Whether using the item removes 1 from inventory afterward — 'read and
  // discarded' actions like unlocking a feature consume; a future
  // 'equipHelm' wouldn't (equipping moves/flags the item, doesn't delete it).
  consumes: boolean;
}

export const ITEM_ACTIONS = {
  unlockBestiary: { description: 'Unlocks the Bestiary.', consumes: true },
} as const satisfies Record<string, ItemActionDef>;

export type ItemActionId = keyof typeof ITEM_ACTIONS;
