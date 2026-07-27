<script lang="ts">
  import { getDistance, getElevationAt } from '../game/state/map.svelte';

  const WINDOW = 30;
  const VIEW_W = 300;
  const VIEW_H = 60;
  const PAD_Y = 6;

  let distance = $derived(getDistance());

  // Elevation is a pure function of distance — recomputed per point on
  // every render rather than read from any stored history.
  let points = $derived.by(() => {
    const start = Math.max(0, distance - (WINDOW - 1));
    const values: number[] = [];
    for (let d = start; d <= distance; d++) values.push(getElevationAt(d));
    return values;
  });

  let linePoints = $derived.by(() => {
    const n = points.length;
    if (n === 0) return '';
    return points
      .map((v, i) => {
        const x = n === 1 ? VIEW_W : (i / (n - 1)) * VIEW_W;
        const y = PAD_Y + (1 - v) * (VIEW_H - PAD_Y * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  let current = $derived(points.at(-1) ?? 0);
  let currentY = $derived(PAD_Y + (1 - current) * (VIEW_H - PAD_Y * 2));
</script>

<div class="elevation-trace">
  <p class="label">
    <span>Elevation</span>
    <span class="value">{(current * 100).toFixed(0)}%</span>
  </p>
  <svg viewBox="0 0 {VIEW_W} {VIEW_H}" preserveAspectRatio="none" class="chart">
    <line x1="0" y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} class="baseline" />
    <polyline points={linePoints} class="line" />
    <circle cx={VIEW_W} cy={currentY} r="4" class="end-dot" />
  </svg>
</div>

<style>
  .elevation-trace {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 8px;
  }
  .value {
    font-variant-numeric: tabular-nums;
  }
  .chart {
    display: block;
    width: 100%;
    height: 60px;
  }
  .baseline {
    stroke: var(--border);
    stroke-width: 1;
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .end-dot {
    fill: var(--accent);
    stroke: var(--page);
    stroke-width: 2;
  }
</style>
