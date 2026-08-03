import { SOUNDS, SOUND_INTENTS, type SoundIntent } from './data/sounds';
import { isSoundEnabled } from './state/settings.svelte';

// Fresh Audio per play, not shared/reused - so overlapping triggers both
// get heard instead of the second cutting the first off.
export function playSound(intent: SoundIntent) {
  if (!isSoundEnabled()) return;
  const audio = new Audio(SOUNDS[SOUND_INTENTS[intent]]);
  // Browsers reject .play() before any user interaction - not a bug.
  audio.play().catch(() => {});
}
