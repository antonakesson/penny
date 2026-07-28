// Cumulative XP required to reach each level, indexed by level - 1.
// Fibonacci x100 growth (deltas 100,100,200,300,500,800,...) - deliberately
// steep. Level 20 is meant to take weeks of idling, not be reachable in an
// alpha session.
export const LEVELS: readonly number[] = [
  0, 100, 200, 400, 700, 1200, 2000, 3300, 5400, 8800, 14300, 23200, 37600, 60900, 98600, 159600, 258300, 418000,
  676400, 1094500,
];

export const LEVEL_CAP = LEVELS.length;
