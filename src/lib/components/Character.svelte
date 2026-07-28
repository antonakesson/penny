<script lang="ts">
  import { getLevelProgress, getDamage, getXpFloatingTexts } from '../game/game';

  let progress = $derived(getLevelProgress());
  let damage = $derived(getDamage());
  let xpIntoLevel = $derived(progress.nextLevelXp === null ? 0 : Math.max(0, progress.progress) * (progress.nextLevelXp - progress.currentLevelXp));
  let xpTexts = $derived(getXpFloatingTexts());
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
</style>
