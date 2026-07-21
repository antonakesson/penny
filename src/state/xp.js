// State-owner for state.xp. Deliberately no level field/curve yet —
// xp is just an accumulating number until something exists to spend
// it on (see CLAUDE.md's roadmap). How much xp a kill is worth is not
// this file's decision; callers pass the amount in.
import { getState, notify } from './state.js';

export function awardXp(amount) {
  getState().xp += amount;
  notify();
}
