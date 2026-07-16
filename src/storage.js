import { getState, loadState } from './state.js';

const SAVE_KEY = 'idle-game-save';

// Bump on breaking changes only (renamed/removed/retyped fields).
// New additive fields need no bump — state.js defaults fill in for
// saves that predate them via Object.assign.
const SAVE_VERSION = 3;

// version N -> N+1 transform. Add one entry per breaking bump.
const migrations = {
  1: (old) => {
    const { nets, ...rest } = old;
    return nets ? { ...rest, slots: nets } : rest;
  },
  2: (old) => {
    const { resource, ...rest } = old;
    return rest;
  },
};

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

  let { version, state: saved } = payload;
  while (version < SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) {
      // no migration path for this old version - discard rather than
      // load a shape we don't know how to reconcile
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    saved = migrate(saved);
    version++;
  }

  if (version !== SAVE_VERSION) {
    // save is from a newer version than this code knows about
    localStorage.removeItem(SAVE_KEY);
    return;
  }

  loadState(saved);
}
