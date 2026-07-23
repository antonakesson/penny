import { getXp, hydrateXp } from './state/xp.svelte';
import { getInventory, hydrateInventory } from './state/inventory.svelte';
import { getCurrentZoneId, hydrateZone } from './state/zone.svelte';
import { serializeMonster, hydrateMonster, type MonsterSnapshot } from './state/monster.svelte';
import { setWelcomeBack } from './state/notice.svelte';
import { simulateOffline } from './engine';
import { ZONES, type ZoneId } from './data/zones';
import type { Inventory } from './types';

const SAVE_KEY = 'idle-game:save';
const BACKUP_KEY = 'idle-game:save:backup';
const SAVE_VERSION = 1;

interface SaveData {
  xp: number;
  inventory: Inventory;
  zone: ZoneId;
  monster: MonsterSnapshot;
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
      monster: serializeMonster(),
    },
  };
}

// Migrations run in order, each bumping raw `data` from its version to the
// next. Empty for now — the seam exists so a future shape change doesn't
// strand saves already on players' machines.
const migrations: Record<number, (data: any) => any> = {};

function migrate(version: number, data: any): SaveData {
  while (version < SAVE_VERSION) {
    const step = migrations[version];
    if (!step) break;
    data = step(data);
    version++;
  }
  return data as SaveData;
}

function isValidEnvelope(raw: unknown): raw is { version: number; savedAt: number; data: unknown } {
  if (!raw || typeof raw !== 'object') return false;
  const env = raw as Record<string, unknown>;
  if (typeof env.version !== 'number' || typeof env.savedAt !== 'number') return false;

  const data = env.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  if (typeof data.xp !== 'number') return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  if (typeof data.zone !== 'string' || !(data.zone in ZONES)) return false;

  const monster = data.monster as Record<string, unknown> | undefined;
  if (!monster || typeof monster.id !== 'string' || typeof monster.hp !== 'number') return false;

  return true;
}

function applySnapshot(data: SaveData) {
  hydrateXp(data.xp);
  hydrateInventory(data.inventory);
  hydrateZone(data.zone);
  hydrateMonster(data.monster);
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

// Loads the save (falling back to the rolling backup if the primary slot is
// missing or corrupt), then fast-forwards combat for time spent away.
export function loadSave(): boolean {
  const envelope = readEnvelope(SAVE_KEY) ?? readEnvelope(BACKUP_KEY);
  if (!envelope) return false;

  applySnapshot(envelope.data);

  const elapsedMs = Math.max(0, Date.now() - envelope.savedAt);
  const summary = simulateOffline(elapsedMs);
  if (summary.kills > 0) setWelcomeBack(summary);

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
