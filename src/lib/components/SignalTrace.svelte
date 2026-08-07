<script lang="ts">
  import { getDistance, getSignalAt, getDifficultyAt, isReturning } from '../game/game';

  // Centered on the player rather than trailing behind them - LOOKAHEAD
  // exists so a stretch of bad signal ahead shows up before you walk into
  // it, not just after. Signal/difficulty are pure functions of distance
  // (elevationNoise), so sampling ahead of ground never walked is exactly as
  // cheap and as valid as sampling ground already walked.
  const LOOKBEHIND = 15;
  const LOOKAHEAD = 15;
  const WINDOW = LOOKBEHIND + LOOKAHEAD + 1;
  const CENTER = LOOKBEHIND;
  const VIEW_W = 300;
  const VIEW_H = 60;
  const PAD_Y = 6;
  const CENTER_X = (CENTER / (WINDOW - 1)) * VIEW_W;
  const ARROW_LEN = 7;
  const ARROW_HALF_W = 5;

  let distance = $derived(getDistance());
  let returning = $derived(isReturning());

  function samplePoints(sampler: (d: number) => number): number[] {
    const start = distance - LOOKBEHIND;
    const values: number[] = [];
    for (let d = start; d <= distance + LOOKAHEAD; d++) values.push(sampler(d));
    return values;
  }

  function toY(v: number): number {
    return PAD_Y + (1 - v) * (VIEW_H - PAD_Y * 2);
  }

  // x-scale always spans the full WINDOW, even when building just the
  // behind- or ahead-half below - a segment's index range comes out of the
  // same fixed lattice as the whole line, so the two halves still meet
  // exactly at CENTER_X instead of each rescaling to its own width.
  function toLine(values: number[], fromIdx: number, toIdx: number): string {
    const points: string[] = [];
    for (let i = fromIdx; i <= toIdx; i++) {
      const x = (i / (WINDOW - 1)) * VIEW_W;
      points.push(`${x.toFixed(1)},${toY(values[i]).toFixed(1)}`);
    }
    return points.join(' ');
  }

  // The "you are here" marker doubles as the direction indicator that used
  // to sit in its own box beside this chart (MiniMap.svelte) - a triangle
  // pointing whichever way advance() currently steps, rather than a plain
  // dot plus a separate glyph saying the same thing twice.
  function arrowPath(cx: number, cy: number, facingRight: boolean): string {
    const dx = facingRight ? 1 : -1;
    const tipX = cx + dx * ARROW_LEN;
    const backX = cx - dx * ARROW_LEN * 0.4;
    return `M ${tipX.toFixed(1)},${cy.toFixed(1)} L ${backX.toFixed(1)},${(cy - ARROW_HALF_W).toFixed(1)} L ${backX.toFixed(1)},${(cy + ARROW_HALF_W).toFixed(1)} Z`;
  }

  let points = $derived(samplePoints(getSignalAt));
  let difficultyPoints = $derived(samplePoints(getDifficultyAt));

  // Walked half (behind + current) solid; ahead half dashed/faint - ground
  // never stepped on reads as a preview, not a promise.
  let pastLine = $derived(toLine(points, 0, CENTER));
  let futureLine = $derived(toLine(points, CENTER, WINDOW - 1));
  let difficultyPastLine = $derived(toLine(difficultyPoints, 0, CENTER));
  let difficultyFutureLine = $derived(toLine(difficultyPoints, CENTER, WINDOW - 1));

  let currentY = $derived(toY(points[CENTER] ?? 0));
  let currentDifficultyY = $derived(toY(difficultyPoints[CENTER] ?? 0));
  let arrowD = $derived(arrowPath(CENTER_X, currentY, !returning));
</script>

<div class="signal-trace">
  <div class="chart-wrap">
    <svg viewBox="0 0 {VIEW_W} {VIEW_H}" preserveAspectRatio="none" class="chart">
      <line x1="0" y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} class="baseline" />
      <line x1={CENTER_X} y1="0" x2={CENTER_X} y2={VIEW_H} class="here-line" />
      <polyline points={difficultyFutureLine} class="line difficulty future" />
      <polyline points={futureLine} class="line future" />
      <polyline points={difficultyPastLine} class="line difficulty" />
      <polyline points={pastLine} class="line" />
      <circle cx={CENTER_X} cy={currentDifficultyY} r="4" class="end-dot difficulty" />
      <path d={arrowD} class="you-are-here" class:returning>
        <title>{returning ? 'Walking back' : 'Walking forward'}</title>
      </path>
    </svg>
    <p class="distance">Distance: {distance}</p>
  </div>
</div>

<style>
  .signal-trace {
    /* Was max-width/margin-bottom directly - now a flexed child of
       MiniMap.svelte, which owns that outer sizing/spacing. */
    flex: 1 1 auto;
    min-width: 0;
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
  .here-line {
    stroke: var(--border);
    stroke-width: 1;
    stroke-dasharray: 2 2;
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
  .line.future {
    opacity: 0.4;
    stroke-dasharray: 4 3;
  }
  .end-dot {
    fill: var(--accent);
    stroke: var(--page);
    stroke-width: 2;
  }
  .end-dot.difficulty {
    fill: var(--wax);
  }
  /* Same wax-on-deviation convention Skills' active tile uses (and the old
     direction box in MiniMap.svelte used) - forward is the default/expected
     state and stays the terrain accent color, returning is the one worth
     flagging. */
  .you-are-here {
    fill: var(--accent);
    stroke: var(--page);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .you-are-here.returning {
    fill: var(--wax);
  }
</style>
