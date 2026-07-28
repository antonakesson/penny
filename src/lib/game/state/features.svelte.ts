import type { FeatureId } from '../data/features';

// Permanent once earned — unlocking reads "the item dropped at least once",
// not "the item is currently held," so selling/losing it later can't
// re-lock the feature.
let unlockedFeatures = $state<FeatureId[]>([]);

// Single slot, not a queue — mirrors ui/confirmDialog.svelte.ts's pattern.
// A second unlock landing before the first is dismissed just overwrites it;
// fine while only one feature exists to unlock.
let pendingAnnouncement = $state<FeatureId | null>(null);

export function isFeatureUnlocked(id: FeatureId): boolean {
  return unlockedFeatures.includes(id);
}

export function unlockFeature(id: FeatureId) {
  if (unlockedFeatures.includes(id)) return;
  unlockedFeatures = [...unlockedFeatures, id];
  pendingAnnouncement = id;
}

export function getPendingAnnouncement(): FeatureId | null {
  return pendingAnnouncement;
}

export function dismissAnnouncement() {
  pendingAnnouncement = null;
}

export function serializeUnlockedFeatures(): FeatureId[] {
  return unlockedFeatures;
}

export function hydrateUnlockedFeatures(value: FeatureId[]) {
  unlockedFeatures = value;
}
