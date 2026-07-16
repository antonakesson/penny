// Starter mode is bare-handed rummaging: short and cheap, so the slot
// engine's active/recovery gate (not a raw click spam) still feels
// like quick repeated action rather than the long net-and-wait cycle
// nets bring later.
export const GATHER = {
  activeMs: 1500,        // slot is occupied performing the action
  recoveryMs: 400,       // cooldown before the slot can be reused
  slotCount: 1,          // parallel actions available
};

export const EQUIPMENT = {
  slots: 2, // how many gear items can be equipped at once
};
