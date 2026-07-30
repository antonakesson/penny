<script lang="ts">
  import { getEncounter } from '../game/game';
  import Discovery from './Discovery.svelte';

  let monster = $derived(getEncounter());
  let pct = $derived(Math.round((monster.hp / monster.maxHp) * 100));
</script>

<section class="encounter" class:done={monster.status === 'dead'}>
  <div class="header">
    <h3 class="name">{monster.name}</h3>
    <span class="level">Lv. {monster.level}</span>
  </div>
  <Discovery {monster} />
  <div class="hp-row">
    <div class="hp-bar">
      {#key monster.instanceId}
        <div class="hp-fill" class:investigate={monster.action === 'investigate'} style="width: {pct}%"></div>
      {/key}
    </div>
  </div>
  <p class="hp-text"><span class="stat-chip">{monster.hp} / {monster.maxHp} HP</span></p>
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
  .hp-fill.investigate {
    background: var(--rarity-uncommon);
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
