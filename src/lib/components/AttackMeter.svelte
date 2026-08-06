<script lang="ts">
  import { getActiveSkill } from '../game/game';
  import { SKILLS } from '../game/data/skills';
  import Meter from './Meter.svelte';

  // Attack is a cast skill now (data/skills.ts) - the same 1500ms windup and
  // 400ms recovery config.ts's ACTION knob used to hold, read off the skill
  // def so the meter can't disagree with what the engine actually runs.
  // SKILLS is `as const`, so `timing` is known to be the cast member here.
  const { timing, cooldownMs } = SKILLS.attack;

  let now = $state(Date.now());

  $effect(() => {
    let frame = requestAnimationFrame(function loop() {
      now = Date.now();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  });

  let active = $derived(getActiveSkill('attack'));
  let phase = $derived(active?.phase ?? 'idle');
  let elapsed = $derived(active ? Math.max(0, now - active.startedAt) : 0);

  let pct = $derived.by(() => {
    if (phase === 'casting') return Math.min(100, (elapsed / timing.castTimeMs) * 100);
    if (phase === 'recovering') return Math.max(0, 100 - (elapsed / cooldownMs) * 100);
    return 0;
  });

  let phaseMs = $derived(phase === 'casting' ? timing.castTimeMs : cooldownMs);
  let remainingMs = $derived(phase === 'idle' ? 0 : Math.max(0, phaseMs - elapsed));

  let label = $derived(
    phase === 'casting' ? 'Attacking…' : phase === 'recovering' ? 'Recovering…' : 'Ready'
  );
</script>

<div class="attack-meter">
  <Meter {label}>
    {#snippet secondary()}
      {#if phase !== 'idle'}<span class="timer">{(remainingMs / 1000).toFixed(1)}s</span>{/if}
    {/snippet}
    {#snippet fill()}
      <div class="fill" class:cooldown={phase === 'recovering'} style="width: {pct}%"></div>
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
