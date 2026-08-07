// Signal-driven encounter selection. Pure math, no Svelte runes - same
// discipline as noise.ts, which this builds on.
//
// The old (pre-b97d00f) version fed the signal straight into weightedPick as
// the cumulative-weight roll. That gave real bands - walk into low signal and
// you're in shrubbery country for a stretch - but it hard-partitioned the
// table: each entry existed *only* inside its own slice of signal-space, and
// the signal's marginal distribution is a bell centered on 0.5 (1D gradient
// noise sums two gradients toward the middle; measured p05 0.26 / p95 0.74,
// nothing past 0.86 in 400k samples). So the table's edges starved and its
// middle gorged - on the Tree Line table, thornyShrubbery came in at 0.08x its
// declared weight, rabbitHole at literally 0x, boar at 1.98x.
//
// Warping the signal to be uniform (histogram-equalizing it through its own
// CDF) fixes the frequencies but wrecks the shape: a monotone warp that steep
// in the tails makes the trace race through the middle and sit slammed at the
// extremes - square waves, not terrain.
//
// So the fix isn't in the signal, it's in the mapping. Two changes:
//
//  1. Soft habitats instead of a hard partition. An entry declares where it
//     *prefers* to live (`habitat`, 0..1 in signal space) and how tolerant it
//     is (`spread`); affinity falls off as a gaussian around that. Every entry
//     stays reachable at every signal, just rarer off-peak - so an entry is
//     rare because it was declared rare, never because the noise doesn't go
//     where it lives. An entry with no habitat is ubiquitous (flat affinity).
//
//  2. Weights still mean what they say. fitHabitatWeights() solves for a
//     per-entry multiplier such that each entry's long-run share over a walk
//     equals its declared share, cancelling out the bell exactly. Authors
//     write `weight` for "how much of this zone is this" and `habitat` for
//     "where in the zone", and the two never fight - no shape-matching the
//     curve by hand, which is the authoring tax that got this ripped out in
//     the first place.
import { DISTANCE_STEP } from '../config';
import { elevationNoise, hashSeed } from './noise';
import { weightedPick } from './weighted';

export interface HabitatEntry<T> {
  id: T;
  weight: number;
  // Preferred signal, 0..1. Omitted means ubiquitous - equal affinity at
  // every signal, so the entry just scatters evenly at its declared weight.
  habitat?: number;
  // Standard deviation of the affinity falloff, in signal units. Lower =
  // tighter, more sharply banded. Defaults to DEFAULT_SPREAD.
  spread?: number;
}

// Tuned by resimulating, not by feel (see scripts note in the fit below).
// At 0.1 a walk shows visible contiguous stretches of one habitat's critters
// while still mixing neighbours in; past ~0.25 the bands wash out into an
// even mush, below ~0.06 a rare habitat's pocket goes all-or-nothing.
const DEFAULT_SPREAD = 0.1;

// A spread of 0 is a plausible thing to author meaning "no tolerance at all",
// but it divides by zero - and at signal exactly on the habitat that's 0/0,
// i.e. NaN, which propagates into every weight and makes weightedPick fall
// through to its last entry silently. Clamped instead: far tighter than any
// useful band, so it reads as the "no tolerance" the author meant.
const MIN_SPREAD = 1e-3;

function affinity<T>(entry: HabitatEntry<T>, signal: number): number {
  if (entry.habitat === undefined) return 1;
  const spread = Math.max(MIN_SPREAD, entry.spread ?? DEFAULT_SPREAD);
  const d = signal - entry.habitat;
  return Math.exp(-(d * d) / (2 * spread * spread));
}

// --- signal marginal distribution -------------------------------------------

const BINS = 64;
const binCenter = (bin: number) => (bin + 0.5) / BINS;

let signalPdf: number[] | undefined;

// How often a walk's signal lands in each bin. A property of the noise
// itself, not of any particular seed - so it's sampled once across a handful
// of fixed seeds and reused for every zone. Sampled rather than derived in
// closed form so it stays correct if noise.ts's amplitude or DISTANCE_STEP
// ever change. Lazy: ~64k noise evals, a few ms, and only on the first
// encounter pick rather than at module load.
function getSignalPdf(): number[] {
  if (signalPdf) return signalPdf;
  const counts = new Array(BINS).fill(0);
  let total = 0;
  for (let s = 0; s < 16; s++) {
    const seed = hashSeed(`habitat-pdf:${s}`);
    for (let d = 0; d < 4000; d++) {
      const signal = (elevationNoise(d * DISTANCE_STEP, seed) + 1) / 2;
      counts[Math.min(BINS - 1, Math.floor(signal * BINS))]++;
      total++;
    }
  }
  signalPdf = counts.map((c) => c / total);
  return signalPdf;
}

// --- weight fit --------------------------------------------------------------

// A multiplier this large means an entry's habitat sits somewhere the signal
// essentially never visits, so no amount of boosting inside that pocket can
// reach its declared share (it's already ~100% of what spawns there). Clamped
// so the arithmetic stays in sane float range; fitReport() below surfaces the
// resulting shortfall so it's diagnosable rather than silent.
const MAX_MULTIPLIER = 1e6;
const FIT_ITERATIONS = 60;

// Fixed-point fit (Sinkhorn-ish): repeatedly measure each entry's expected
// long-run share under the current multipliers and correct toward its target.
// Converges in well under FIT_ITERATIONS for any sane table. Runs against the
// binned PDF, not a simulation, so it's deterministic and cheap.
function fit<T>(entries: readonly HabitatEntry<T>[]): number[] {
  const pdf = getSignalPdf();
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const target = entries.map((e) => e.weight / totalWeight);
  const aff = entries.map((e) => pdf.map((_, bin) => affinity(e, binCenter(bin))));
  const multipliers = entries.map(() => 1);

  for (let iter = 0; iter < FIT_ITERATIONS; iter++) {
    const share = entries.map(() => 0);
    for (let bin = 0; bin < BINS; bin++) {
      if (pdf[bin] === 0) continue;
      let denom = 0;
      for (let i = 0; i < entries.length; i++) denom += entries[i].weight * multipliers[i] * aff[i][bin];
      if (denom <= 0) continue;
      for (let i = 0; i < entries.length; i++) {
        share[i] += (pdf[bin] * entries[i].weight * multipliers[i] * aff[i][bin]) / denom;
      }
    }
    for (let i = 0; i < entries.length; i++) {
      if (share[i] > 1e-12) {
        multipliers[i] = Math.min(MAX_MULTIPLIER, multipliers[i] * (target[i] / share[i]));
      }
    }
  }
  return multipliers;
}

// Keyed on the table's own array identity - zone tables are `const` literals
// in data/zones.ts, so each subzone's array is a stable object and its fit is
// computed once per session.
const fitCache = new WeakMap<readonly HabitatEntry<unknown>[], number[]>();

function fitCached<T>(entries: readonly HabitatEntry<T>[]): number[] {
  let cached = fitCache.get(entries as readonly HabitatEntry<unknown>[]);
  if (!cached) {
    cached = fit(entries);
    fitCache.set(entries as readonly HabitatEntry<unknown>[], cached);
  }
  return cached;
}

// Picks against the table as re-weighted by the current signal: still a plain
// uniform roll, but over weights that lean toward whatever lives around here.
// A table where nothing declares a habitat reduces exactly to the flat
// weightedPick this replaced (every affinity 1, every multiplier 1).
export function pickByHabitat<T>(entries: readonly HabitatEntry<T>[], signal: number): T {
  const multipliers = fitCached(entries);
  return weightedPick(entries.map((e, i) => [e.id, e.weight * multipliers[i] * affinity(e, signal)] as const));
}

export interface HabitatFitRow<T> {
  id: T;
  declared: number; // 0..1 share the table asks for
  expected: number; // 0..1 share the fit actually achieves over a long walk
}

// What the fit converged to, for balancing. An `expected` that undershoots
// `declared` means that entry's habitat is somewhere the signal rarely
// reaches - widen its spread or move it toward 0.5. Read by devtools.
export function habitatFitReport<T>(entries: readonly HabitatEntry<T>[]): HabitatFitRow<T>[] {
  const pdf = getSignalPdf();
  const multipliers = fitCached(entries);
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const expected = entries.map(() => 0);
  for (let bin = 0; bin < BINS; bin++) {
    if (pdf[bin] === 0) continue;
    const w = entries.map((e, i) => e.weight * multipliers[i] * affinity(e, binCenter(bin)));
    const denom = w.reduce((sum, x) => sum + x, 0);
    if (denom <= 0) continue;
    for (let i = 0; i < entries.length; i++) expected[i] += (pdf[bin] * w[i]) / denom;
  }
  return entries.map((e, i) => ({ id: e.id, declared: e.weight / totalWeight, expected: expected[i] }));
}
