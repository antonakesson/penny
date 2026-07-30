<script lang="ts">
  import { getEncounter } from '../game/game';
  import { INVESTIGATE } from '../game/config';
  import Discovery from './Discovery.svelte';
  import type { Investigation } from '../game/types';

  let investigation = $derived(getEncounter() as Investigation);
  let pct = $derived(Math.round((investigation.hp / investigation.maxHp) * 100));
  // hp/maxHp stay the runtime mechanism (see ENCOUNTER_REFACTOR.md decision
  // 3 - dps-based, engine.ts untouched), but this is a timer, not a health
  // bar - show seconds remaining, not a fraction labeled HP.
  let secondsLeft = $derived(Math.ceil(investigation.hp / INVESTIGATE.dps));
</script>

<section class="encounter" class:done={investigation.status === 'dead'}>
  <Discovery monster={investigation}>
    <div class="header">
      <h3 class="name">{investigation.name}</h3>
    </div>
  </Discovery>
  <div class="hp-row">
    <div class="hp-bar">
      {#key investigation.instanceId}
        <div class="hp-fill" style="width: {pct}%"></div>
      {/key}
    </div>
  </div>
  <p class="hp-text"><span class="stat-chip">{secondsLeft}s left</span></p>
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
    background: var(--rarity-uncommon);
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
