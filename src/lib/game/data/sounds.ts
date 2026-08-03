import coinUrl from '../../../assets/coin.mp3';
import woopUrl from '../../../assets/woop.mp3';

export const SOUNDS = {
  coin: coinUrl,
  woop: woopUrl,
} as const;

export type SoundId = keyof typeof SOUNDS;

// Call sites name a game intent; this table decides which file plays.
export const SOUND_INTENTS = {
  LootDropped: 'coin',
  LootEmpty: 'woop',
  ItemUsed: 'coin',
} as const satisfies Record<string, SoundId>;

export type SoundIntent = keyof typeof SOUND_INTENTS;
