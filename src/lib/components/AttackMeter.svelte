<script lang="ts">
  import { getAction } from '../game/game';
  import { ACTION } from '../game/config';

  let now = $state(Date.now());

  $effect(() => {
    let frame = requestAnimationFrame(function loop() {
      now = Date.now();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  });

  let action = $derived(getAction());
  let phase = $derived(action.status);
  let elapsed = $derived(action.startedAt !== null ? Math.max(0, now - action.startedAt) : 0);

  let pct = $derived.by(() => {
    if (phase === 'active') return Math.min(100, (elapsed / ACTION.activeMs) * 100);
    if (phase === 'cooldown') return Math.max(0, 100 - (elapsed / ACTION.cooldownMs) * 100);
    return 0;
  });

  let phaseMs = $derived(phase === 'active' ? ACTION.activeMs : ACTION.cooldownMs);
  let remainingMs = $derived(phase === 'idle' ? 0 : Math.max(0, phaseMs - elapsed));

  let label = $derived(
    phase === 'active' ? 'Attacking…' : phase === 'cooldown' ? 'Recovering…' : 'Ready'
  );
</script>

<div class="attack-meter">
  <p class="label">
    <span>{label}</span>
    {#if phase !== 'idle'}<span class="timer">{(remainingMs / 1000).toFixed(1)}s</span>{/if}
  </p>
  <div class="bar">
    <div class="fill" class:cooldown={phase === 'cooldown'} style="width: {pct}%"></div>
  </div>
</div>

<style>
  .attack-meter {
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
  .timer {
    font-variant-numeric: tabular-nums;
  }
  .bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: background-color 0.2s ease-in-out;
  }
  .fill.cooldown {
    background: var(--accent-text);
    opacity: 0.7;
  }
</style>
