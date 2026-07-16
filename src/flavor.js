// Presentation-only. Swap this file to reskin the same engine mechanics
// (e.g. traps, snares, foraging) without touching engine.js or state.js.

export const RESOURCE_LABEL = 'Loot';

export const SLOT_LABEL = (index) => `Net ${index + 1}`;

export const STATUS_LABEL = {
  idle: 'Cast net',
  active: 'Fishing…',
  recovery: 'Untangling…',
};
