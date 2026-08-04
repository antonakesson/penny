<script lang="ts">
  import {
    devToolsSpawn,
    devToolsAddItem,
    devToolsAwardXp,
    devToolsSetDistance,
    devToolsTriggerEffect,
    devToolsSetSeed,
    devToolsSetZone,
    getDistance,
    getSeed,
    getFlags,
  } from '../game/game';
  import { ENCOUNTERS, type EncounterId } from '../game/data/encounters';
  import { ITEMS, type ItemId } from '../game/data/loot';
  import { EFFECTS, type EffectId } from '../game/data/effects';
  import { ZONES, type ZoneId } from '../game/data/zones';

  const monsterIds = Object.keys(ENCOUNTERS) as EncounterId[];
  const itemIds = Object.keys(ITEMS) as ItemId[];
  const effectIds = Object.keys(EFFECTS) as EffectId[];
  const zoneIds = Object.keys(ZONES) as ZoneId[];

  let selectedMonster = $state<EncounterId>(monsterIds[0]);
  let selectedItem = $state<ItemId>(itemIds[0]);
  let itemQty = $state(1);
  let xpAmount = $state(100);
  let distanceInput = $state(getDistance());
  let seedInput = $state(getSeed());
  let selectedEffect = $state<EffectId>(effectIds[0]);
  let selectedZone = $state<ZoneId>(zoneIds[0]);
  let flags = $derived(Object.entries(getFlags()));
</script>

<div class="devtools">
  <section>
    <p class="section-label">Spawn</p>
    <div class="row">
      <select bind:value={selectedMonster} aria-label="Encounter to spawn">
        {#each monsterIds as id (id)}
          <option value={id}>{ENCOUNTERS[id].name}</option>
        {/each}
      </select>
      <button onclick={() => devToolsSpawn(selectedMonster)}>Spawn</button>
    </div>
  </section>

  <section>
    <p class="section-label">Inventory</p>
    <div class="row">
      <select bind:value={selectedItem} aria-label="Item to add">
        {#each itemIds as id (id)}
          <option value={id}>{ITEMS[id].name}</option>
        {/each}
      </select>
      <input type="number" min="1" bind:value={itemQty} aria-label="Quantity" />
      <button onclick={() => devToolsAddItem(selectedItem, itemQty)}>Add item</button>
    </div>
  </section>

  <section>
    <p class="section-label">XP</p>
    <div class="row">
      <input type="number" min="0" bind:value={xpAmount} aria-label="XP amount" />
      <button onclick={() => devToolsAwardXp(xpAmount)}>Award XP</button>
    </div>
  </section>

  <section>
    <p class="section-label">Map</p>
    <div class="row">
      <input type="number" min="0" bind:value={distanceInput} aria-label="Distance" />
      <button onclick={() => devToolsSetDistance(distanceInput)}>Set distance</button>
    </div>
    <div class="row">
      <input class="seed-input" type="text" bind:value={seedInput} aria-label="Seed" />
      <button onclick={() => devToolsSetSeed(seedInput)}>Set seed</button>
    </div>
    <div class="row">
      <select bind:value={selectedZone} aria-label="Zone to jump to">
        {#each zoneIds as id (id)}
          <option value={id}>{ZONES[id].name}</option>
        {/each}
      </select>
      <button onclick={() => devToolsSetZone(selectedZone)}>Set zone</button>
    </div>
  </section>

  <section>
    <p class="section-label">Effects</p>
    <div class="row">
      <select bind:value={selectedEffect} aria-label="Effect to trigger">
        {#each effectIds as id (id)}
          <option value={id}>{EFFECTS[id].title}</option>
        {/each}
      </select>
      <button onclick={() => devToolsTriggerEffect(selectedEffect)}>Trigger</button>
    </div>
  </section>

  <section>
    <p class="section-label">Flags</p>
    <ul class="flags">
      {#each flags as [id, value] (id)}
        <li class:flag-set={value}>{id}: {value}</li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .devtools {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .row + .row {
    margin-top: 8px;
  }
  .seed-input {
    flex: 1 1 auto;
    min-width: 0;
    font-family: var(--font-mono);
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
  .flags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font: 500 12px/1.4 var(--font-mono);
    color: var(--ink-faint);
  }
  .flags li.flag-set {
    color: var(--ink);
  }
</style>
