<script lang="ts">
  import {
    devToolsSpawn,
    devToolsAddItem,
    devToolsAwardXp,
    devToolsSetDistance,
    devToolsStartSpawnFreeze,
    getDistance,
  } from '../game/game';
  import { MONSTERS, type MonsterId } from '../game/data/monstats';
  import { ITEMS, type ItemId } from '../game/data/loot';
  import { SPAWN_FREEZE_KILLS } from '../game/config';

  const monsterIds = Object.keys(MONSTERS) as MonsterId[];
  const itemIds = Object.keys(ITEMS) as ItemId[];

  let selectedMonster = $state<MonsterId>(monsterIds[0]);
  let selectedItem = $state<ItemId>(itemIds[0]);
  let itemQty = $state(1);
  let xpAmount = $state(100);
  let distanceInput = $state(getDistance());
</script>

<div class="devtools">
  <section>
    <p class="section-label">Spawn</p>
    <div class="row">
      <select bind:value={selectedMonster}>
        {#each monsterIds as id (id)}
          <option value={id}>{MONSTERS[id].name}</option>
        {/each}
      </select>
      <button onclick={() => devToolsSpawn(selectedMonster)}>Spawn</button>
    </div>
  </section>

  <section>
    <p class="section-label">Inventory</p>
    <div class="row">
      <select bind:value={selectedItem}>
        {#each itemIds as id (id)}
          <option value={id}>{ITEMS[id].name}</option>
        {/each}
      </select>
      <input type="number" min="1" bind:value={itemQty} />
      <button onclick={() => devToolsAddItem(selectedItem, itemQty)}>Add item</button>
    </div>
  </section>

  <section>
    <p class="section-label">XP</p>
    <div class="row">
      <input type="number" min="0" bind:value={xpAmount} />
      <button onclick={() => devToolsAwardXp(xpAmount)}>Award XP</button>
    </div>
  </section>

  <section>
    <p class="section-label">Map</p>
    <div class="row">
      <input type="number" min="0" bind:value={distanceInput} />
      <button onclick={() => devToolsSetDistance(distanceInput)}>Set distance</button>
    </div>
  </section>

  <section>
    <p class="section-label">Spawn freeze</p>
    <div class="row">
      <button onclick={() => devToolsStartSpawnFreeze(SPAWN_FREEZE_KILLS)}>
        Start ({SPAWN_FREEZE_KILLS} kills)
      </button>
    </div>
  </section>
</div>

<style>
  .devtools {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .section-label {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 10px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  select,
  input,
  button {
    font: 500 12px/1 var(--font-ui);
    color: var(--ink);
    background: var(--page-sunken);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 14px;
  }
  select {
    flex: 1 1 auto;
    min-width: 0;
  }
  input[type='number'] {
    width: 70px;
  }
  button {
    white-space: nowrap;
    cursor: pointer;
  }
</style>
