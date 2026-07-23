<script lang="ts">
  import { getEncounter } from '../game/game';
  import FloatingText from './FloatingText.svelte';

  let encounter = $derived(getEncounter());
  let entryNo = $derived(encounter.type === 'monster' ? encounter.monster.entryNo : encounter.event.entryNo);
  let entryLabel = $derived(`Entry No. ${String(entryNo).padStart(3, '0')}`);
  let name = $derived(encounter.type === 'monster' ? encounter.monster.name : encounter.event.name);
  let instanceId = $derived(encounter.type === 'monster' ? encounter.monster.instanceId : encounter.event.instanceId);
  let done = $derived(encounter.type === 'monster' ? encounter.monster.status === 'dead' : encounter.event.status === 'resolved');
  let pct = $derived(
    encounter.type === 'monster'
      ? Math.round((encounter.monster.hp / encounter.monster.maxHp) * 100)
      : Math.round(((encounter.event.tapsRequired - encounter.event.tapsRemaining) / encounter.event.tapsRequired) * 100)
  );
</script>

<section class="encounter" class:done>
  <p class="entry-no">{entryLabel}</p>
  <div class="header">
    <h3 class="name">{name}</h3>
    {#if encounter.type === 'monster'}<span class="level">Lv. {encounter.monster.level}</span>{/if}
  </div>
  <div class="hp-row">
    <div class="hp-bar">
      {#key instanceId}
        <div class="hp-fill" style="width: {pct}%"></div>
      {/key}
    </div>
    <FloatingText />
  </div>
  <p class="hp-text">
    <span class="stat-chip">
      {#if encounter.type === 'monster'}{encounter.monster.hp} / {encounter.monster.maxHp} HP{:else}{encounter.event.tapsRemaining} taps left{/if}
    </span>
  </p>
</section>

<style>
  .encounter {
    margin-bottom: 20px;
    max-width: 340px;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  .encounter.done {
    opacity: 0.4;
  }
  .entry-no {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .name {
    font: 700 20px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0;
  }
  .level {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    white-space: nowrap;
  }
  .hp-row {
    position: relative;
  }
  .hp-bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
  }
  .hp-fill {
    height: 100%;
    background: var(--wax);
    transition: width 0.15s ease-out;
  }
  .hp-text {
    margin: 8px 0 0;
    text-align: right;
  }
  .hp-text .stat-chip {
    font-size: 13px;
    padding: 4px 10px;
  }
</style>
