<script lang="ts">
  import { getEncounter } from '../game/game';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import Meter from './Meter.svelte';
  import type { Monster } from '../game/types';

  let monster = $derived(getEncounter() as Monster);
  let pct = $derived(Math.round((monster.hp / monster.maxHp) * 100));
</script>

<EncounterCardShell encounter={monster}>
  <div class="hp-row">
    <Meter>
      {#snippet fill()}
        {#key monster.instanceId}
          <div class="hp-fill" style="width: {pct}%"></div>
        {/key}
      {/snippet}
    </Meter>
  </div>
  <p class="hp-text"><span class="stat-chip">{monster.hp} / {monster.maxHp} HP</span></p>
</EncounterCardShell>

<style>
  .hp-row {
    position: relative;
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
