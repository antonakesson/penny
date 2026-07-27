import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeEncounter, hydrateEncounter, type EncounterSnapshot } from './state/encounter.svelte';
import { serializeDiscoveredMonsters, hydrateDiscoveredMonsters } from './state/bestiary.svelte';
import { serializeMap, hydrateMap, type MapSnapshot } from './state/map.svelte';
import { ZONES, type ZoneId } from './data/zones';
import type { Inventory } from './types';

const SAVE_KEY = 'idle-game:save';
const BACKUP_KEY = 'idle-game:save:backup';
const SAVE_VERSION = 8;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  encounter?: EncounterSnapshot;
  discoveredMonstersMask: string;
  map: MapSnapshot;
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
    },
  };
}

// Migrations run in order, each bumping raw `data` from its version to the
// next. v1 had a single `monster` field instead of the `monster | event`
// union `encounter` field, and no `mercenaries` roster at all. v2's
// `encounter.type` ('monster' | 'event') became `encounter.kind`
// ('monster' | 'treasure' | 'recruit') once events split into per-shape
// runtimes instead of a single generic tap counter. v3's recruit runtime
// gained hold-to-progress fields (heldMs/isHolding/lastTickAt) for stages
// with `interaction: 'hold'`. v4 renamed the `recruit` encounter kind to
// `pet` and the `mercenaries` roster field to `pets`. v5 had no
// `discoveredMonstersMask` — the Bestiary didn't exist yet. v6's event
// system (treasure/pet encounters, the pets roster) was ripped out entirely
// — an in-flight event has no faithful mapping to the monster-only shape,
// same pragmatic "treat it as abandoned" call as v2's migration below, so
// non-monster encounters are just dropped and left for a fresh spawn. v7 had
// no `map` field — the elevation-noise encounter bias didn't exist yet, so a
// fresh seed/distance is generated rather than guessed.
const migrations: Record<number, (data: any) => any> = {
  1: (data) => ({
    xp: data.xp,
    inventory: data.inventory,
    zone: data.zone,
    encounter: { type: 'monster', id: data.monster.id, hp: data.monster.hp, status: data.monster.status, diedAt: data.monster.diedAt },
    mercenaries: [],
  }),
  2: (data) => {
    const enc = data.encounter;
    let encounter;
    if (enc.type === 'monster') {
      encounter = { kind: 'monster', id: enc.id, hp: enc.hp, status: enc.status, diedAt: enc.diedAt };
    } else {
      // v2's generic tap counter (`tapsRemaining`) has no faithful mapping to
      // the new stage/timer runtime shape — treat an in-flight event as
      // abandoned and let it restart clean, same pragmatic spirit as the
      // "no offline catch-up" decision below.
      encounter = { kind: 'treasure', id: enc.id, runtime: { startedAt: null, status: 'active', resolvedAt: null } };
    }
    return { xp: data.xp, inventory: data.inventory, zone: data.zone, encounter, mercenaries: data.mercenaries };
  },
  3: (data) => {
    const enc = data.encounter;
    if (enc.kind === 'recruit') {
      // Hold-progress didn't exist in v3 saves — resume from empty rather
      // than guessing, same pragmatic spirit as the v2 migration above.
      enc.runtime = { ...enc.runtime, heldMs: 0, isHolding: false, lastTickAt: null };
    }
    return data;
  },
  4: (data) => {
    const enc = data.encounter;
    if (enc.kind === 'recruit') enc.kind = 'pet';
    return { xp: data.xp, inventory: data.inventory, zone: data.zone, encounter: enc, pets: data.mercenaries };
  },
  5: (data) => ({ ...data, discoveredMonstersMask: '0' }),
  6: (data) => {
    const enc = data.encounter;
    const { pets, ...rest } = data;
    return { ...rest, encounter: enc.kind === 'monster' ? { id: enc.id, hp: enc.hp, status: enc.status, diedAt: enc.diedAt } : undefined };
  },
  7: (data) => ({ ...data, map: { seed: crypto.randomUUID(), distance: 0 } }),
};

function migrate(version: number, data: any): SaveData {
  while (version < SAVE_VERSION) {
    const step = migrations[version];
    if (!step) break;
    data = step(data);
    version++;
  }
  return data as SaveData;
}

// Validated per-version since migrate() runs *after* this check — an older
// save on disk still has its own version's shape, not the current one.
function isValidEnvelope(raw: unknown): raw is { version: number; savedAt: number; data: unknown } {
  if (!raw || typeof raw !== 'object') return false;
  const env = raw as Record<string, unknown>;
  if (typeof env.version !== 'number' || typeof env.savedAt !== 'number') return false;

  const data = env.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  if (typeof data.xp !== 'number') return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  if (typeof data.zone !== 'string' || !(data.zone in ZONES)) return false;

  if (env.version === 1) {
    const monster = data.monster as Record<string, unknown> | undefined;
    return !!monster && typeof monster.id === 'string' && typeof monster.hp === 'number';
  }

  // v2..v4 all share the `encounter` + `mercenaries` shape; the encounter
  // tag's allowed values changed at v3 (`type` -> `kind`, `event` split into
  // `treasure`/`recruit`) and again at v5 (`recruit` -> `pet`, alongside the
  // `mercenaries` -> `pets` rename). v6 added `discoveredMonstersMask`. v7
  // dropped the event system — `encounter` is monster-only and optional,
  // `pets` is gone. v8 added `map` (seed + distance driving the elevation
  // encounter bias).
  if (env.version >= 8) {
    if (typeof data.discoveredMonstersMask !== 'string') return false;
    const map = data.map as Record<string, unknown> | undefined;
    if (!map || typeof map.seed !== 'string' || typeof map.distance !== 'number') return false;
    const encounter = data.encounter as Record<string, unknown> | undefined;
    return encounter === undefined || typeof encounter.id === 'string';
  }
  if (env.version === 7) {
    if (typeof data.discoveredMonstersMask !== 'string') return false;
    const encounter = data.encounter as Record<string, unknown> | undefined;
    return encounter === undefined || typeof encounter.id === 'string';
  }
  const encounter = data.encounter as Record<string, unknown> | undefined;
  if (!encounter) return false;
  if (env.version >= 6) {
    if (!Array.isArray(data.pets) || typeof data.discoveredMonstersMask !== 'string') return false;
    return encounter.kind === 'monster' || encounter.kind === 'treasure' || encounter.kind === 'pet';
  }
  if (env.version >= 5) {
    if (!Array.isArray(data.pets)) return false;
    return encounter.kind === 'monster' || encounter.kind === 'treasure' || encounter.kind === 'pet';
  }
  if (!Array.isArray(data.mercenaries)) return false;
  if (env.version >= 3) return encounter.kind === 'monster' || encounter.kind === 'treasure' || encounter.kind === 'recruit';
  return encounter.type === 'monster' || encounter.type === 'event';
}

function applySnapshot(data: SaveData) {
  hydrateXp(data.xp);
  hydrateInventory(data.inventory);
  hydrateZone(data.zone);
  // Must run before hydrateEncounter() — reconstructing the current monster
  // reads bestiary discovery state to stamp its isNewDiscovery flag, so the
  // mask needs to already be in place or an already-discovered monster
  // would look new again on every reload.
  hydrateDiscoveredMonsters(data.discoveredMonstersMask);
  if (data.encounter) hydrateEncounter(data.encounter);
  hydrateMap(data.map);
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
    return { version: SAVE_VERSION, savedAt: parsed.savedAt, data: migrate(parsed.version, parsed.data) };
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
    applySnapshot(migrate(parsed.version, parsed.data));
    saveNow();
    return true;
  } catch {
    return false;
  }
}
