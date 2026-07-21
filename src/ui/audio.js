const COIN_SRC = 'assets/coin.mp3';
const WOOP_SRC = 'assets/woop.mp3';

let unlocked = false;

function createAudio(src) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

// One persistent element per sound, reused on every play — a fresh
// new Audio() per call meant every play was an entirely new element
// that had never itself been played during a user gesture. Some
// browsers (Safari in particular) only grant autoplay permission to
// the specific element a gesture played, not to newly constructed
// ones, which reads as "the sound plays once, then never again."
const coinAudio = createAudio(COIN_SRC);
const woopAudio = createAudio(WOOP_SRC);

// Autoplay policies allow a play() call inside a user-gesture handler, but
// playCoin()/playWoop() fire later from an async tick. Unlock both here
// (a quick play-then-pause on each, inside the gesture) so the later
// calls are allowed to make sound.
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  for (const audio of [coinAudio, woopAudio]) {
    audio.play()
      .then(() => { audio.pause(); audio.currentTime = 0; })
      .catch((err) => console.warn('audio unlock failed:', err));
  }
}

function replay(audio, label) {
  audio.currentTime = 0;
  audio.play().catch((err) => console.warn(`${label} sfx blocked:`, err));
}

export function playCoin() {
  replay(coinAudio, 'coin');
}

export function playWoop() {
  replay(woopAudio, 'woop');
}
