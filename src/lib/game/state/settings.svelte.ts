// Device/browser preferences, not game progress — kept out of save.ts's
// versioned snapshot so resetting your save doesn't also flip your sound
// off, and importing a friend's save doesn't import their mute state.
const SOUND_ENABLED_KEY = 'idle-game:settings:soundEnabled';

function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

let soundEnabled = $state(readSoundEnabled());

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(value: boolean) {
  soundEnabled = value;
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(value));
  } catch {
    // Storage unavailable — setting just won't survive a reload.
  }
}
