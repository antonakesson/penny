<script lang="ts">
  import { MONSTERS } from '../game/data/monstats';
  import { isMonsterDiscovered, getMaxDiscoveredEntryNo } from '../game/game';

  const nameByEntryNo = Object.fromEntries(Object.values(MONSTERS).map((m) => [m.entryNo, m.name]));

  let maxEntryNo = $derived(getMaxDiscoveredEntryNo());
  let rows = $derived(
    Array.from({ length: maxEntryNo }, (_, i) => {
      const entryNo = i + 1;
      return { entryNo, name: isMonsterDiscovered(entryNo) ? nameByEntryNo[entryNo] : null };
    })
  );
</script>

{#if rows.length === 0}
  <p class="empty">Nothing encountered yet. Go hit something.</p>
{:else}
  <ul class="entry-list">
    {#each rows as row (row.entryNo)}
      <li class="entry-row">
        <span class="entry-no">{String(row.entryNo).padStart(3, '0')}.</span>
        {#if row.name}
          <span class="entry-name">{row.name}</span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0;
  }
  .entry-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .entry-row {
    display: flex;
    gap: 10px;
    font: 600 13px/1.4 var(--font-ui);
  }
  .entry-no {
    color: var(--ink-faint);
    letter-spacing: 0.06em;
    font-variant-numeric: tabular-nums;
  }
  .entry-name {
    color: var(--ink-strong);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
</style>
