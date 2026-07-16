import { addResource } from './state.js';
import { saveState } from './storage.js';

export const actions = {
  click: () => addResource(1),
  save: saveState,
};
