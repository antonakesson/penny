import { subscribe, getState } from './state.js';
import { setText } from './dom.js';

export function initRender() {
  render(getState());
  subscribe(render);
}

function render(state) {
  setText('#resource-count', Math.floor(state.resource));
}
