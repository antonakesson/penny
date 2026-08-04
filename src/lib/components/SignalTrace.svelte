<script lang="ts">
  import { getDistance, getSignalAt, getDifficultyAt } from '../game/game';

  const WINDOW = 30;
  const VIEW_W = 300;
  const VIEW_H = 60;
  const PAD_Y = 6;

  let distance = $derived(getDistance());

  // Both signals are pure functions of distance — recomputed per point on
  // every render rather than read from any stored history.
  function samplePoints(sampler: (d: number) => number): number[] {
    const start = Math.max(0, distance - (WINDOW - 1));
    const values: number[] = [];
    for (let d = start; d <= distance; d++) values.push(sampler(d));
    return values;
  }

  function toLine(values: number[]): string {
    const n = values.length;
    if (n === 0) return '';
    return values
      .map((v, i) => {
        const x = n === 1 ? VIEW_W : (i / (n - 1)) * VIEW_W;
        const y = PAD_Y + (1 - v) * (VIEW_H - PAD_Y * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  let points = $derived(samplePoints(getSignalAt));
  let difficultyPoints = $derived(samplePoints(getDifficultyAt));

  let linePoints = $derived(toLine(points));
  let difficultyLinePoints = $derived(toLine(difficultyPoints));

  let current = $derived(points.at(-1) ?? 0);
  let currentY = $derived(PAD_Y + (1 - current) * (VIEW_H - PAD_Y * 2));

  let currentDifficulty = $derived(difficultyPoints.at(-1) ?? 0);
  let currentDifficultyY = $derived(PAD_Y + (1 - currentDifficulty) * (VIEW_H - PAD_Y * 2));
</script>

<div class="signal-trace">
  <div class="chart-wrap">
    <svg viewBox="0 0 {VIEW_W} {VIEW_H}" preserveAspectRatio="none" class="chart">
      <line x1="0" y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} class="baseline" />
      <polyline points={difficultyLinePoints} class="line difficulty" />
      <polyline points={linePoints} class="line" />
      <circle cx={VIEW_W} cy={currentDifficultyY} r="4" class="end-dot difficulty" />
      <circle cx={VIEW_W} cy={currentY} r="4" class="end-dot" />
    </svg>
    <p class="distance">Distance: {distance}</p>
  </div>
</div>

<style>
  .signal-trace {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .chart-wrap {
    position: relative;
  }
  .distance {
    position: absolute;
    left: 2px;
    bottom: 2px;
    margin: 0;
    font: 400 12px/1 var(--font-ui);
    color: var(--ink-faint);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .chart {
    display: block;
    width: 100%;
    height: 60px;
    overflow: visible;
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
  .line.difficulty {
    stroke: var(--wax);
  }
  .end-dot {
    fill: var(--accent);
    stroke: var(--page);
    stroke-width: 2;
  }
  .end-dot.difficulty {
    fill: var(--wax);
  }
</style>
