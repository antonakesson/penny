let lastInteractionAt = $state<number | null>(null);

export function recordActivity(now: number) {
  lastInteractionAt = now;
}

export function getIdleMs(now: number): number {
  return lastInteractionAt === null ? Infinity : now - lastInteractionAt;
}
