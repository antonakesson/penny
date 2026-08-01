import type { Rarity } from './data/loot';
import type { DialogNodeId } from './data/dialog';

interface EncounterBase {
  instanceId: number; // UI-transition key only (hp-fill transition reset) — not meaningful data
  id: string;
  name: string;
  status: 'active' | 'dead';
  diedAt: number | null;
  // Snapshot at spawn time, not derived live from bestiary state — the
  // Bestiary marks this monster discovered almost immediately (well before
  // it's dead), so if this read the live flag instead, the "first time
  // you meet it" label would vanish out from under the player within a
  // tick of appearing.
  isNewDiscovery: boolean;
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

// hp-drain, continuous-hold resolution — same resolution mechanism and
// runtime shape as Monster (hp/dps stay intact), but its own real fields:
// no `level` (meaningless for a one-shot investigation); `maxHp` is derived
// at construction time from an honestly authored duration, not authored
// directly as a guessed hp number.
export interface Investigation extends EncounterBase {
  action: 'investigate';
  hp: number;
  maxHp: number;
  xpReward: number;
  dropTableId: readonly string[];
}

// Discrete, click-to-resolve — no ActionState mutex (see ActionKind). Has
// `level` — a social encounter is expected to scale like a real encounter,
// unlike Investigation. `dialogRoot` is the def's static entry node (never
// mutates); `currentNode` is where the conversation actually is right now,
// advanced one pick at a time via pickDialogChoice() in encounter.svelte.ts.
export interface Social extends EncounterBase {
  action: 'social';
  level: number;
  dialogRoot: DialogNodeId;
  currentNode: DialogNodeId;
}

export type Encounter = Monster | Investigation | Social;

// Only the hp-drain kinds share the timing mutex below — attack and
// investigate are mutually exclusive activities on the same "self" occupant.
// Social's discrete click-to-pick skips it entirely (see
// ENCOUNTER_REFACTOR.md decision 1).
export type ActionKind = 'attack' | 'investigate';

export interface ActionState {
  // Meaningless while status is 'idle' - whichever kind's onDown() fires
  // next stamps it fresh. Both attack and investigate share this one
  // mutex since only one is ever in progress at a time.
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
