import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeEncounter, hydrateEncounter, type EncounterSnapshot } from './state/encounter.svelte';
import { serializeDiscoveredMonsters, hydrateDiscoveredMonsters } from './state/bestiary.svelte';
import { serializeMap, hydrateMap, type MapSnapshot } from './state/map.svelte';
import { serializeUnlockedFeatures, hydrateUnlockedFeatures } from './state/features.svelte';
import { serializeFiredEvents, hydrateFiredEvents } from './state/events.svelte';
import { serializeEffects, hydrateEffects } from './state/effect.svelte';
import { serializeModifiers, hydrateModifiers } from './state/modifier.svelte';
import { ZONES, type ZoneId } from './data/zones';
import type { FeatureId } from './data/features';
import type { EffectId } from './data/effects';
import type { Modifier } from './data/modifiers';
import type { Inventory } from './types';

const SAVE_KEY = 'idle-game:save';
const BACKUP_KEY = 'idle-game:save:backup';
// v4: EncounterSnapshot became a discriminated union (Monster/Investigation/
// RabbidSquirrel) instead of one flat shape - see ENCOUNTER_REFACTOR.md.
// v5: added `effects` (timed-effect expiries, e.g. spawn freeze).
// v6: added `modifiers` (permanent stat grants, e.g. a consumed book).
const SAVE_VERSION = 6;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  encounter?: EncounterSnapshot;
  discoveredMonstersMask: string;
  map: MapSnapshot;
  unlockedFeatures: FeatureId[];
  firedEventsMask: string;
  effects: Partial<Record<EffectId, number>>;
  modifiers: Modifier[];
}

interface SaveEnvelope {
  version: number;
  savedAt: number;
  data: SaveData;
}

function buildSnapshot(): SaveEnvelope {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    data: {
      xp: getXp(),
      inventory: { ...getInventory() },
      zone: getCurrentZoneId(),
      encounter: serializeEncounter(),
      discoveredMonstersMask: serializeDiscoveredMonsters(),
      map: serializeMap(),
      unlockedFeatures: serializeUnlockedFeatures(),
      firedEventsMask: serializeFiredEvents(),
      effects: serializeEffects(),
      modifiers: serializeModifiers(),
    },
  };
}

// No migrations — SAVE_VERSION bumps are breaking. A save from a different
// version is discarded outright rather than shimmed forward.
function isValidEnvelope(raw: unknown): raw is SaveEnvelope {
  if (!raw || typeof raw !== 'object') return false;
  const env = raw as Record<string, unknown>;
  if (env.version !== SAVE_VERSION || typeof env.savedAt !== 'number') return false;

  const data = env.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  if (typeof data.xp !== 'number') return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  if (typeof data.zone !== 'string' || !(data.zone in ZONES)) return false;
  if (typeof data.discoveredMonstersMask !== 'string') return false;
  if (!Array.isArray(data.unlockedFeatures)) return false;
  if (typeof data.firedEventsMask !== 'string') return false;
  if (!data.effects || typeof data.effects !== 'object') return false;
  if (!Array.isArray(data.modifiers)) return false;

  const map = data.map as Record<string, unknown> | undefined;
  if (!map || typeof map.seed !== 'string' || typeof map.distance !== 'number') return false;

  const encounter = data.encounter as Record<string, unknown> | undefined;
  return (
    encounter === undefined ||
    (typeof encounter.id === 'string' &&
      typeof encounter.action === 'string' &&
      typeof encounter.isNewDiscovery === 'boolean')
  );
}

function applySnapshot(data: SaveData) {
  hydrateXp(data.xp);
  hydrateInventory(data.inventory);
  hydrateZone(data.zone);
  hydrateDiscoveredMonsters(data.discoveredMonstersMask);
  if (data.encounter) hydrateEncounter(data.encounter);
  hydrateMap(data.map);
  hydrateUnlockedFeatures(data.unlockedFeatures);
  hydrateFiredEvents(data.firedEventsMask);
  hydrateEffects(data.effects);
  hydrateModifiers(data.modifiers);
}

// Set by resetSave() so the pagehide/visibilitychange autosave that fires
// during its reload can't immediately re-persist the state we just cleared.
let suppressAutosave = false;

export function saveNow() {
  if (suppressAutosave) return;
  try {
    const existing = localStorage.getItem(SAVE_KEY);
    if (existing) localStorage.setItem(BACKUP_KEY, existing);
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSnapshot()));
  } catch {
    // Storage full/unavailable (private browsing, quota) — skip silently,
    // the next autosave tick will just try again.
  }
}

function readEnvelope(key: string): SaveEnvelope | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidEnvelope(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Loads the save, falling back to the rolling backup if the primary slot is
// missing or corrupt. No offline catch-up — there's no idle mechanic yet to
// justify progress while away; see the pet/companion system planned
// for that.
export function loadSave(): boolean {
  const envelope = readEnvelope(SAVE_KEY) ?? readEnvelope(BACKUP_KEY);
  if (!envelope) return false;

  applySnapshot(envelope.data);
  return true;
}

export function exportSave(): string {
  return btoa(JSON.stringify(buildSnapshot()));
}

// Clears both save slots and reloads to a fresh game. Sets suppressAutosave
// first — otherwise the reload's own pagehide-triggered saveNow() would
// serialize the still-live (unreset) in-memory state right back over the
// clear, same race that makes clearing localStorage by hand "not take."
export function resetSave() {
  suppressAutosave = true;
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // Storage unavailable — nothing to clear either way.
  }
  location.reload();
}

export function importSave(encoded: string): boolean {
  try {
    const parsed: unknown = JSON.parse(atob(encoded.trim()));
    if (!isValidEnvelope(parsed)) return false;
    applySnapshot(parsed.data);
    saveNow();
    return true;
  } catch {
    return false;
  }
}
