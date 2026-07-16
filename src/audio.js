const COIN_SRC = 'assets/coin.mp3';

let unlocked = false;

function createAudio() {
  const audio = new Audio(COIN_SRC);
  audio.preload = 'auto';
  return audio;
}

// Autoplay policies allow a play() call inside a user-gesture handler, but
// playCoin() fires later from an async tick. Unlock once here (a silent,
// immediately-paused play) so the later call is allowed to make sound.
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  const audio = createAudio();
  audio.volume = 0;
  audio.play()
    .then(() => { audio.pause(); audio.currentTime = 0; })
    .catch((err) => console.warn('audio unlock failed:', err));
}

export function playCoin() {
  const audio = createAudio();
  audio.play().catch((err) => console.warn('coin sfx blocked:', err));
}
