import type { ActionState } from '../types';

let action = $state<ActionState>({ status: 'idle', startedAt: null });

export function getAction(): ActionState {
  return action;
}

export function setActionActive(startedAt: number) {
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
