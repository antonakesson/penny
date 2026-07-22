let xp = $state(0);

export function getXp(): number {
  return xp;
}

export function awardXp(amount: number) {
  xp += amount;
}
