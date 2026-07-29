import { SOUNDS, SOUND_INTENTS, type SoundIntent } from './data/sounds';
import { isSoundEnabled } from './state/settings.svelte';

// A fresh Audio per play (not one shared/reused element) so overlapping
// triggers - e.g. two kills landing the same tick - both get heard instead
// of the second cutting the first off.
export function playSound(intent: SoundIntent) {
  if (!isSoundEnabled()) return;
  const audio = new Audio(SOUNDS[SOUND_INTENTS[intent]]);
  // Browsers reject .play() before any user interaction has occurred on the
  // page - a swallowed rejection there, not a bug to surface.
  audio.play().catch(() => {});
}
