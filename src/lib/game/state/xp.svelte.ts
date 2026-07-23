let xp = $state(0);

export function getXp(): number {
  return xp;
}

export function awardXp(amount: number) {
  xp += amount;
}

export function hydrateXp(value: number) {
  xp = value;
}
