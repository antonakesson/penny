export const GATHER = {
  activeMs: 3000,        // slot is occupied performing the action
  recoveryMs: 1500,      // cooldown before the slot can be reused
  slotCount: 1,          // parallel actions available
  yieldMultiplier: 1,    // scales resource gained per success
  successChance: 0.9,    // odds a resolved action yields anything
  yieldMin: 1,
  yieldMax: 3,
};

export const EQUIPMENT = {
  slots: 2, // how many gear items can be equipped at once
};
