<script lang="ts">
  import { getLevelProgress, getDamage, getXpFloatingTexts, getActiveEffects, sumModifier } from '../game/game';
  import { EFFECTS, type EffectId } from '../game/data/effects';
  import { STAT_LABELS, type StatId } from '../game/data/modifiers';

  const STAT_IDS = Object.keys(STAT_LABELS) as StatId[];

  let progress = $derived(getLevelProgress());
  let damage = $derived(getDamage());
  let xpIntoLevel = $derived(progress.nextLevelXp === null ? 0 : Math.max(0, progress.progress) * (progress.nextLevelXp - progress.currentLevelXp));
  let xpTexts = $derived(getXpFloatingTexts());

  // Polls purely to re-render the countdown - state/effect.svelte.ts itself
  // never ticks.
  let activeEffects = $state<{ id: EffectId; remainingMs: number }[]>([]);
  $effect(() => {
    const update = () => (activeEffects = getActiveEffects());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  });

  let modifierRows = $derived(
    STAT_IDS.map((stat) => ({ stat, value: sumModifier(stat) })).filter((row) => row.value !== 0)
  );
</script>

<div class="character">
  <p class="level">Level {progress.level}</p>
  <div class="bar-wrap">
    <div class="bar" class:maxed={progress.isMaxLevel}>
      <div class="fill" style="width: {Math.min(1, progress.progress) * 100}%"></div>
    </div>
    <div class="xp-float-layer">
      {#each xpTexts as t (t.id)}
        <span class="xp-float">{t.text}</span>
      {/each}
    </div>
  </div>
  {#if progress.isMaxLevel}
    <p class="xp-label">Max level reached.</p>
  {:else}
    <p class="xp-label">{Math.floor(xpIntoLevel)} / {progress.nextLevelXp! - progress.currentLevelXp} XP to next level</p>
  {/if}
  <p class="stat">Base Damage: {damage}</p>
  {#if activeEffects.length > 0 || modifierRows.length > 0}
    <div class="effects">
      <p class="effects-label">Active Effects</p>
      {#each activeEffects as effect (effect.id)}
        <p class="effect-row">{EFFECTS[effect.id].title} — {Math.ceil(effect.remainingMs / 1000)}s</p>
      {/each}
      {#each modifierRows as row (row.stat)}
        <p class="effect-row">{row.value > 0 ? '+' : ''}{row.value} {STAT_LABELS[row.stat]}</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  .character {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .level {
    font: 700 20px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink-strong);
    margin: 0;
  }
  .bar-wrap {
    position: relative;
  }
  .bar {
    height: 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--page-sunken);
    overflow: hidden;
  }
  .bar.maxed {
    border-color: var(--accent);
  }
  .fill {
    height: 100%;
    background: var(--accent);
  }
  .xp-float-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .xp-float {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translate(-50%, 0);
    font: 700 13px/1 var(--font-ui);
    color: var(--accent-text);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    animation: xp-float-rise 1.8s ease-out forwards;
  }
  @keyframes xp-float-rise {
    0% {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    30% {
      transform: translate(-50%, -1.6rem);
      opacity: 1;
    }
    70% {
      transform: translate(-50%, -1.6rem);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -1.6rem);
      opacity: 0;
    }
  }
  .xp-label {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink-faint);
    margin: 0;
  }
  .stat {
    font: 600 14px/1 var(--font-ui);
    color: var(--ink-strong);
    margin: 4px 0 0;
  }
  .effects {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }
  .effects-label {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink-faint);
    margin: 0;
  }
  .effect-row {
    font: 600 13px/1.4 var(--font-ui);
    color: var(--accent-text);
    margin: 0;
  }
</style>
