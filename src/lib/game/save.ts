import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeEncounter, hydrateEncounter, type EncounterSnapshot } from './state/encounter.svelte';
import { serializeMap, hydrateMap, type MapSnapshot } from './state/map.svelte';
import { serializeUnlockedFeatures, hydrateUnlockedFeatures } from './state/features.svelte';
import { serializeFiredEvents, hydrateFiredEvents } from './state/events.svelte';
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
// v0: pre-release baseline. Still alpha, no save worth preserving across
// shape changes yet, so the version history resets here instead of
// accumulating an ever-growing changelog comment. No migrations -
// SAVE_VERSION bumps are breaking; a save from a different version is
// discarded outright rather than shimmed forward.
// v1: added `journalFlagsMask` (opaque "this has happened" bits, see
// state/journalFlags.svelte.ts) and `journalEntries` (the diary log, see
// state/journal.svelte.ts).
const SAVE_VERSION = 1;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  encounter?: EncounterSnapshot[];
  map: MapSnapshot;
  unlockedFeatures: FeatureId[];
  firedEventsMask: string;
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
      firedEventsMask: serializeFiredEvents(),
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
  if (typeof data.firedEventsMask !== 'string') return false;
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
  if (!map || typeof map.seed !== 'string' || typeof map.distance !== 'number') return false;

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
  hydrateFiredEvents(data.firedEventsMask);
  hydrateEffects(data.effects);
  hydrateModifiers(data.modifiers);
  hydrateFlags(data.journalFlagsMask);
  hydrateEntries(data.journalEntries);
}

// isValidEnvelope only checks shape (types, key presence) - it can't catch
// something like an encounter `action` string that isn't a real EncounterId,
// which only blows up once a hydrate function actually switches on it (e.g.
// assertNever in encounter.svelte.ts). This is the last line of defense for
// that case, so a save file can be well-typed but still semantically bogus.
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
// missing, corrupt, or throws during hydrate. No offline catch-up — there's
// no idle mechanic yet to justify progress while away; see the pet/companion
// system planned for that.
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
    // Every shape-valid slot still threw during hydrate - earlier slices in
    // applySnapshot may already be partially mutated from those attempts, so
    // the only guaranteed way back to a known-good baseline is a fresh
    // module load, same as resetSave()'s clear-and-reload. Suppress first,
    // same reason as resetSave(): the reload's own pagehide-triggered
    // saveNow() would otherwise persist that partially-mutated state right
    // back into the slots we just cleared.
    suppressAutosave = true;
    location.reload();
  }
  return false;
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
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(encoded.trim()));
  } catch {
    return false;
  }
  if (!isValidEnvelope(parsed)) return false;

  if (!applySnapshotSafely(parsed.data)) {
    // Hydrate threw partway through - don't leave the running game sitting
    // on a half-mutated state. Nothing was written to storage yet, so
    // reloading falls back to whatever save/backup existed before this
    // import attempt. Suppress autosave first so the reload's pagehide
    // doesn't persist the half-mutated in-memory state over that save.
    suppressAutosave = true;
    location.reload();
    return false;
  }
  saveNow();
  return true;
}
