import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeEncounter, hydrateEncounter, type EncounterSnapshot } from './state/encounter.svelte';
import { serializePets, hydratePets } from './state/pet.svelte';
import { ZONES, type ZoneId } from './data/zones';
import { EVENTS, type EventId } from './data/events';
import type { Inventory } from './types';

const SAVE_KEY = 'idle-game:save';
const BACKUP_KEY = 'idle-game:save:backup';
const SAVE_VERSION = 5;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  encounter: EncounterSnapshot;
  pets: string[];
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
      pets: serializePets(),
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
// `pet` and the `mercenaries` roster field to `pets`.
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
      const def = EVENTS[enc.id as EventId];
      encounter =
        def.kind === 'treasure'
          ? { kind: 'treasure', id: enc.id, runtime: { startedAt: null, status: 'active', resolvedAt: null } }
          : { kind: 'recruit', id: enc.id, runtime: { stageIndex: 0, stageStartedAt: null, status: 'active', resolvedAt: null } };
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
  // `mercenaries` -> `pets` rename).
  const encounter = data.encounter as Record<string, unknown> | undefined;
  if (!encounter) return false;
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
  hydrateEncounter(data.encounter);
  hydratePets(data.pets);
}

export function saveNow() {
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
