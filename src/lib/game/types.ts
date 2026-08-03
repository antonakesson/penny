import type { Rarity } from './data/loot';
import type { DialogNodeId } from './data/dialog';
import type { CharacterId } from './data/characters';

interface EncounterBase {
  instanceId: number; // UI-transition key only (hp-fill transition reset) — not meaningful data
  id: string;
  name: string;
  status: 'active' | 'dead';
  diedAt: number | null;
}

// hp-drain, discrete-swing resolution.
export interface Monster extends EncounterBase {
  action: 'attack';
  level: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

// hp-drain, continuous-hold resolution. No `level` - meaningless for a
// one-shot investigation.
export interface Investigation extends EncounterBase {
  action: 'investigate';
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

// Discrete, click-to-resolve - no ActionState mutex. `dialogRoot` is the
// def's static entry node; `currentNode` is where the conversation actually
// is, advanced via pickDialogChoice() in encounter.svelte.ts.
export interface Social extends EncounterBase {
  action: 'social';
  level: number;
  dialogRoot: DialogNodeId;
  currentNode: DialogNodeId;
  // Written by a dialog `rename` line (see DialogLine in data/dialog.ts) -
  // overrides CHARACTERS' default display name for the rest of this
  // encounter. Keyed by character, not global, so unrelated speakers in the
  // same encounter don't share a name slot.
  nameOverrides: Partial<Record<CharacterId, string>>;
}

export type Encounter = Monster | Investigation | Social;

// Only the hp-drain kinds use this mutex - Social's click-to-pick skips it.
export type ActionKind = 'attack' | 'investigate';

export interface ActionState {
  // Meaningless while status is 'idle' - whichever kind's onDown() fires
  // next stamps it fresh.
  kind: ActionKind;
  status: 'idle' | 'active' | 'cooldown';
  startedAt: number | null;
}

export type Inventory = Record<string, number>;

export interface FloatingTextEntry {
  id: number;
  text: string;
  variant: 'damage' | 'loot';
  offset: number;
  rarity?: Rarity;
}
