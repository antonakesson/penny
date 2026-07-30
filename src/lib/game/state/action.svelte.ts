import type { ActionState, ActionKind } from '../types';

let action = $state<ActionState>({ kind: 'attack', status: 'idle', startedAt: null });

export function getAction(): ActionState {
  return action;
}

export function setActionActive(kind: ActionKind, startedAt: number) {
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
