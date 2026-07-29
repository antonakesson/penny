import type { ActionState } from '../types';
import type { EncounterAction } from '../data/monstats';

let action = $state<ActionState>({ kind: 'attack', status: 'idle', startedAt: null });

export function getAction(): ActionState {
  return action;
}

export function setActionActive(kind: EncounterAction, startedAt: number) {
  action.kind = kind;
  action.status = 'active';
  action.startedAt = startedAt;
}

export function setActionCooldown(startedAt: number) {
  action.status = 'cooldown';
  action.startedAt = startedAt;
}

export function setActionIdle() {
  action.status = 'idle';
  action.startedAt = null;
}
