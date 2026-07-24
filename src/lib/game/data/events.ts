import { hasPet } from '../state/pet.svelte';

export interface TreasureEventDef {
  kind: 'treasure';
  name: string;
  entryNo: number;
  lore: string;
  image?: string;
  investigateLabel: string;
  durationMs: number;
  xpReward: number;
  dropTableId: readonly string[];
}

export interface RecruitStage {
  label: string;
  lore?: string;
  durationMs: number;
  // 'timer' (default): click once, progress runs on its own — walk away.
  // 'hold': progress only accumulates while held, and decays while released.
  interaction?: 'timer' | 'hold';
}

export interface PetEventDef {
  kind: 'pet';
  name: string;
  entryNo: number;
  image?: string;
  petId: string;
  stages: RecruitStage[];
}

export type EventDef = TreasureEventDef | PetEventDef;

export const EVENTS = {
  mysteriousRubble: {
    kind: 'treasure',
    name: 'Mysterious Rubble',
    entryNo: 2,
    lore: 'A cairn of stones, stacked with more care than the surrounding wreckage suggests. Something underneath is worth the effort of moving them.',
    investigateLabel: 'Investigate',
    durationMs: 120_000,
    xpReward: 10,
    dropTableId: ['noobTreasure'],
  },
  rabidSquirrel: {
    kind: 'pet',
    name: 'Rabid Squirrel',
    entryNo: 1,
    petId: 'rabidSquirrel',
    stages: [
      { label: 'Investigate', durationMs: 60_000, interaction: undefined },
      { label: 'Argue emphatically', durationMs: 30_000, interaction: 'hold' },
      { label: 'Recruit', durationMs: 60_000, interaction: undefined },
    ],
  },
} as const satisfies Record<string, EventDef>;

export type EventId = keyof typeof EVENTS;

// Each event owns its own eligibility check — the picker just asks
// "can this spawn right now," never how that's determined.
const ELIGIBILITY: Partial<Record<EventId, () => boolean>> = {
  rabidSquirrel: () => !hasPet('rabidSquirrel'),
};

export function isEventEligible(id: EventId): boolean {
  return ELIGIBILITY[id]?.() ?? true;
}
