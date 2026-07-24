import type { MonsterId } from './monstats';
import { isEventEligible, type EventId } from './events';
import { weightedPick } from '../util/weighted';

export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees speak in low, continuous tones about the weather, mostly. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose, and then hunger.',
    monsters: [
      { id: 'boar', weight: 10 },
      { id: 'honeybee', weight: 1 },
      { id: 'badger', weight: 15 },
    ] as { id: MonsterId; weight: number }[],
    events: [
      { id: 'rabidSquirrel', weight: 2 },
      { id: 'mysteriousRubble', weight: 3 },
    ] as { id: EventId; weight: number }[],
  },
} as const;

export type ZoneId = keyof typeof ZONES;

export type EncounterPick = { type: 'monster'; id: MonsterId } | { type: 'event'; id: EventId };

// Eligibility is filtered here, at selection time — the pool itself doesn't
// know or care why an event might be excluded, that's owned by the event
// module (see isEventEligible).
export function pickEncounter(zoneId: ZoneId): EncounterPick {
  const zone = ZONES[zoneId];
  const monsterPool = zone.monsters.map((m) => ({ type: 'monster' as const, id: m.id, weight: m.weight }));
  const eventPool = zone.events
    .filter((e) => isEventEligible(e.id))
    .map((e) => ({ type: 'event' as const, id: e.id, weight: e.weight }));
  const pool = [...monsterPool, ...eventPool];
  return weightedPick(pool.map((entry) => [entry, entry.weight] as const));
}
