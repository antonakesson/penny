const state = {
  resource: 0,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener(state);
}

export function addResource(amount) {
  state.resource += amount;
  notify();
}

export function loadState(saved) {
  Object.assign(state, saved);
  notify();
}
