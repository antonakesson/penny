<script lang="ts">
  import { getAction } from '../game/game';
  import { ACTION } from '../game/config';
  import Meter from './Meter.svelte';

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
  <Meter {label}>
    {#snippet secondary()}
      {#if phase !== 'idle'}<span class="timer">{(remainingMs / 1000).toFixed(1)}s</span>{/if}
    {/snippet}
    {#snippet fill()}
      <div class="fill" class:cooldown={phase === 'cooldown'} style="width: {pct}%"></div>
    {/snippet}
  </Meter>
</div>

<style>
  .attack-meter {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .timer {
    font-variant-numeric: tabular-nums;
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
