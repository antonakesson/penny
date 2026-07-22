<script lang="ts">
  import { getAction } from '../game/game';
  import { GATHER } from '../game/config';

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 100);
    return () => clearInterval(id);
  });

  let action = $derived(getAction());
  let active = $derived(action.status === 'active');
  let elapsed = $derived(active && action.startedAt !== null ? now - action.startedAt : 0);
  let pct = $derived(active ? Math.min(100, (elapsed / GATHER.activeMs) * 100) : 0);
  let remainingMs = $derived(active ? Math.max(0, GATHER.activeMs - elapsed) : 0);
</script>

<div class="attack-meter">
  <p class="label">
    <span>{active ? 'Attacking…' : 'Ready'}</span>
    {#if active}<span class="timer">{(remainingMs / 1000).toFixed(1)}s</span>{/if}
  </p>
  <div class="bar">
    <div class="fill" style="width: {pct}%"></div>
  </div>
</div>

<style>
  .attack-meter {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .label {
    display: flex;
    justify-content: space-between;
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 6px;
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
    transition: width 0.15s ease-out;
  }
</style>
