import { LEVELS, LEVEL_CAP } from '../data/levels';

let xp = $state(0);

export function getXp(): number {
  return xp;
}

export function addXp(amount: number) {
  xp += amount;
}

export function hydrateXp(value: number) {
  xp = value;
}

// Derived from xp, not stored - LEVELS[0] is always 0 so this never falls
// through without a match.
export function getLevel(): number {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export interface LevelProgress {
  level: number;
  isMaxLevel: boolean;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progress: number;
}

export function getLevelProgress(): LevelProgress {
  const level = getLevel();
  const isMaxLevel = level >= LEVEL_CAP;
  const currentLevelXp = LEVELS[level - 1];
  const nextLevelXp = isMaxLevel ? null : LEVELS[level];
  const progress = nextLevelXp === null ? 1 : (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return { level, isMaxLevel, currentLevelXp, nextLevelXp, progress };
}
