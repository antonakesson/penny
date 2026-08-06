<script lang="ts">
  import { getEncounter, getChannelDps } from '../game/game';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import Meter from './Meter.svelte';
  import type { Investigation } from '../game/types';

  let investigation = $derived(getEncounter() as Investigation);
  let pct = $derived(Math.round((investigation.hp / investigation.maxHp) * 100));
  // hp/maxHp are the runtime mechanism, but this reads as a timer - show
  // seconds remaining, not a fraction labeled HP.
  let secondsLeft = $derived(Math.ceil(investigation.hp / getChannelDps('investigate')));
</script>

<EncounterCardShell encounter={investigation}>
  <div class="hp-row">
    <Meter>
      {#snippet fill()}
        {#key investigation.instanceId}
          <div class="hp-fill" style="width: {pct}%"></div>
        {/key}
      {/snippet}
    </Meter>
  </div>
  <p class="hp-text"><span class="stat-chip">{secondsLeft}s left</span></p>
</EncounterCardShell>

<style>
  .hp-row {
    position: relative;
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
