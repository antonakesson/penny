import { getState, loadState } from './state/state.js';

const SAVE_KEY = 'idle-game-save';

// Single local player, no install base to protect — bump on any shape
// change (not just breaking ones) and let mismatched saves get
// discarded rather than maintaining a migration chain for saves only
// one person ever has. Reset to 0 after the 2026-07-19 system rollback
// rather than carry the old count forward — the number has no meaning
// beyond "does this match," so there's nothing to preserve by counting
// up instead of resetting.
const SAVE_VERSION = 2; // bumped: state gained xp field

export function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: getState() }));
}

export function loadSavedState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return;
  }

  if (payload.version !== SAVE_VERSION) {
    // shape doesn't match this build - discard rather than load a
    // shape this code doesn't know how to reconcile
    localStorage.removeItem(SAVE_KEY);
    return;
  }

  loadState(payload.state);
}
