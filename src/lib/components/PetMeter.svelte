<script lang="ts">
  import { getPet } from '../game/game';
  import { PET } from '../game/config';
  import Meter from './Meter.svelte';

  let now = $state(Date.now());

  $effect(() => {
    let frame = requestAnimationFrame(function loop() {
      now = Date.now();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  });

  let pet = $derived(getPet());
  let phase = $derived(pet.status);
  let elapsed = $derived(pet.startedAt !== null ? Math.max(0, now - pet.startedAt) : 0);

  let pct = $derived.by(() => {
    if (phase === 'attacking') return Math.min(100, (elapsed / PET.activeMs) * 100);
    if (phase === 'recovering') return Math.max(0, 100 - (elapsed / PET.recoveryMs) * 100);
    return 0;
  });

  let phaseMs = $derived(phase === 'attacking' ? PET.activeMs : PET.recoveryMs);
  let remainingMs = $derived(phase === 'idle' ? 0 : Math.max(0, phaseMs - elapsed));

  let label = $derived(
    phase === 'attacking' ? 'Attacking…' : phase === 'recovering' ? 'Recovering…' : 'Ready'
  );
</script>

<div class="pet-meter">
  <Meter {label}>
    {#snippet secondary()}
      {#if phase !== 'idle'}<span class="timer">{(remainingMs / 1000).toFixed(1)}s</span>{/if}
    {/snippet}
    {#snippet fill()}
      <div class="fill" class:recovering={phase === 'recovering'} style="width: {pct}%"></div>
    {/snippet}
  </Meter>
</div>

<style>
  .pet-meter {
    max-width: 340px;
  }
  .timer {
    font-variant-numeric: tabular-nums;
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: background-color 0.2s ease-in-out;
  }
  .fill.recovering {
    background: var(--accent-text);
    opacity: 0.7;
  }
</style>
