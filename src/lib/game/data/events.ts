import { hasMercenary } from '../state/mercenary.svelte';
import type { EventOutcome } from '../types';

export interface EventDef {
  name: string;
  entryNo: number;
  tapsRequired: number;
  outcome: EventOutcome;
}

export const EVENTS = {
  rabidSquirrel: {
    name: 'Rabid Squirrel',
    entryNo: 1,
    tapsRequired: 5,
    outcome: { type: 'recruit', mercenaryId: 'rabidSquirrel' },
  },
} as const satisfies Record<string, EventDef>;

export type EventId = keyof typeof EVENTS;

// Each event owns its own eligibility check — the picker just asks
// "can this spawn right now," never how that's determined.
const ELIGIBILITY: Partial<Record<EventId, () => boolean>> = {
  rabidSquirrel: () => !hasMercenary('rabidSquirrel'),
};

export function isEventEligible(id: EventId): boolean {
  return ELIGIBILITY[id]?.() ?? true;
}
