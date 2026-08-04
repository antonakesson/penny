import { LEVELS, LEVEL_CAP } from '../data/levels';
import { spawnXpFloatingText } from './xpFloatingText.svelte';

let xp = $state(0);

export function getXp(): number {
  return xp;
}

// Floating text lives here, not at each call site - every XP source (a
// kill, a devtools cheat, a dialog/item grantXp effect) gets the same
// on-screen feedback for free, instead of each caller having to remember to
// pair addXp() with its own spawnXpFloatingText() call. See combatEngine.ts's
// now-removed awardXp() wrapper for the shape this replaced.
export function addXp(amount: number) {
  xp += amount;
  spawnXpFloatingText(amount);
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
