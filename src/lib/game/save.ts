import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeEncounter, hydrateEncounter, type EncounterSnapshot } from './state/encounter.svelte';
import { serializeMap, hydrateMap, type MapSnapshot } from './state/map.svelte';
import { serializeUnlockedFeatures, hydrateUnlockedFeatures } from './state/features.svelte';
import { serializeEffects, hydrateEffects } from './state/effect.svelte';
import { serializeModifiers, hydrateModifiers } from './state/modifier.svelte';
import { serializeFlags, hydrateFlags } from './state/journalFlags.svelte';
import { serializeEntries, hydrateEntries, type JournalEntry } from './state/journal.svelte';
import { ZONES, type ZoneId } from './data/zones';
import type { FeatureId } from './data/features';
import type { EffectId } from './data/effects';
import type { Modifier } from './data/modifiers';
import type { Inventory } from './types';

const SAVE_KEY = 'idle-game:save';
const BACKUP_KEY = 'idle-game:save:backup';
// No migrations - a save from a different version is discarded outright.
// Bumped 1->2 when MapSnapshot's `distance: number` became per-zone
// `distances`; bumped 2->3 when `frontier`/`returning` joined it - an old
// save's shape wouldn't hydrate correctly even if it happened to pass
// isValidEnvelope, so bumping is the honest signal rather than letting
// shape-validation catch it by accident.
const SAVE_VERSION = 3;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  encounter?: EncounterSnapshot[];
  map: MapSnapshot;
  unlockedFeatures: FeatureId[];
  effects: Partial<Record<EffectId, number>>;
  modifiers: Modifier[];
  journalFlagsMask: string;
  journalEntries: JournalEntry[];
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
      map: serializeMap(),
      unlockedFeatures: serializeUnlockedFeatures(),
      effects: serializeEffects(),
      modifiers: serializeModifiers(),
      journalFlagsMask: serializeFlags(),
      journalEntries: serializeEntries(),
    },
  };
}

function isValidEnvelope(raw: unknown): raw is SaveEnvelope {
  if (!raw || typeof raw !== 'object') return false;
  const env = raw as Record<string, unknown>;
  if (env.version !== SAVE_VERSION || typeof env.savedAt !== 'number') return false;

  const data = env.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  if (typeof data.xp !== 'number') return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  if (typeof data.zone !== 'string' || !(data.zone in ZONES)) return false;
  if (!Array.isArray(data.unlockedFeatures)) return false;
  if (!data.effects || typeof data.effects !== 'object') return false;
  if (!Array.isArray(data.modifiers)) return false;
  if (typeof data.journalFlagsMask !== 'string') return false;
  if (
    !Array.isArray(data.journalEntries) ||
    !data.journalEntries.every((e) => {
      const entry = e as Record<string, unknown>;
      return typeof entry.id === 'string' && typeof entry.text === 'string';
    })
  )
    return false;

  const map = data.map as Record<string, unknown> | undefined;
  if (
    !map ||
    typeof map.seed !== 'string' ||
    !map.distances ||
    typeof map.distances !== 'object' ||
    !map.frontier ||
    typeof map.frontier !== 'object' ||
    typeof map.returning !== 'boolean'
  )
    return false;

  const encounter = data.encounter;
  return (
    encounter === undefined ||
    (Array.isArray(encounter) &&
      encounter.every((e) => {
        const entry = e as Record<string, unknown>;
        return typeof entry.id === 'string' && typeof entry.action === 'string';
      }))
  );
}

function applySnapshot(data: SaveData) {
  hydrateXp(data.xp);
  hydrateInventory(data.inventory);
  hydrateZone(data.zone);
  if (data.encounter) hydrateEncounter(data.encounter);
  hydrateMap(data.map);
  hydrateUnlockedFeatures(data.unlockedFeatures);
  hydrateEffects(data.effects);
  hydrateModifiers(data.modifiers);
  hydrateFlags(data.journalFlagsMask);
  hydrateEntries(data.journalEntries);
}

// isValidEnvelope only checks shape - a save can be well-typed but still
// semantically bogus (e.g. an `action` string that isn't a real
// EncounterId), which only blows up once a hydrate function switches on it.
function applySnapshotSafely(data: SaveData): boolean {
  try {
    applySnapshot(data);
    return true;
  } catch {
    return false;
  }
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
    // Storage full/unavailable - skip silently, next tick tries again.
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

// Falls back to the rolling backup if the primary slot is missing, corrupt,
// or throws during hydrate.
export function loadSave(): boolean {
  let attempted = false;
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    const envelope = readEnvelope(key);
    if (!envelope) continue;
    if (applySnapshotSafely(envelope.data)) return true;
    attempted = true;
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable - nothing to clear either way.
    }
  }
  if (attempted) {
    // Every slot threw during hydrate - state may be partially mutated, so
    // a fresh module load is the only way back to known-good.
    suppressAutosave = true;
    location.reload();
  }
  return false;
}

export function exportSave(): string {
  return btoa(JSON.stringify(buildSnapshot()));
}

export function resetSave() {
  // Suppress first - otherwise the reload's own pagehide saveNow() would
  // persist the still-live in-memory state right back over the clear.
  suppressAutosave = true;
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // Storage unavailable - nothing to clear either way.
  }
  location.reload();
}

export function importSave(encoded: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(encoded.trim()));
  } catch {
    return false;
  }
  if (!isValidEnvelope(parsed)) return false;

  if (!applySnapshotSafely(parsed.data)) {
    // Hydrate threw partway through - reload falls back to the prior save
    // rather than leaving the game on a half-mutated state.
    suppressAutosave = true;
    location.reload();
    return false;
  }
  saveNow();
  return true;
}
