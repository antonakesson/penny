// Presentation-only. Swap this file to reskin the same engine mechanics
// (e.g. traps, snares, foraging) without touching engine.js or state.js.

// Weapon-slot name — will show the equipped weapon once equipment
// exists; for now everyone's unarmed.
export const SLOT_LABEL = () => 'Unarmed';

export const MISS_MESSAGE = 'Miss';

export const STATUS_LABEL = {
  idle: 'Attack',
  active: 'Attacking…',
  recovery: 'Recovering…',
};
