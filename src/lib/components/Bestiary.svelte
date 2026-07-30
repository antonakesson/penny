<script lang="ts">
  import { BESTIARY_ENTRIES, type BestiaryEntry } from '../game/data/bestiary';
  import { isMonsterDiscovered, getMaxDiscoveredEntryNo } from '../game/game';

  // Widen each entry to BestiaryEntry explicitly - as-const'd for the
  // compile-time bestiary check (see data/bestiary.ts), so an entry that
  // never wrote `note` doesn't have the property at all in its own literal
  // type, only in the shared interface.
  const entryByNo: Record<number, BestiaryEntry> = Object.fromEntries(
    BESTIARY_ENTRIES.map((entry): [number, BestiaryEntry] => [entry.entryNo, entry])
  );

  let maxEntryNo = $derived(getMaxDiscoveredEntryNo());
  let rows = $derived(
    Array.from({ length: maxEntryNo }, (_, i) => {
      const entryNo = i + 1;
      const discovered = isMonsterDiscovered(entryNo);
      const entry = entryByNo[entryNo];
      return {
        entryNo,
        name: discovered ? entry?.name : null,
        // The Bestiary's own aside, separate from the encounter's own
        // flavor text (which lives on the encounter card itself now, every
        // time it's live - see Discovery.svelte). Sparse on purpose: most
        // entries don't earn one.
        note: discovered ? entry?.note : undefined,
      };
    })
  );
</script>

{#if rows.length === 0}
  <p class="empty">Nothing encountered yet. Go hit something.</p>
{:else}
  <ul class="entry-list">
    {#each rows as row (row.entryNo)}
      <li class="entry-row">
        <div class="entry-header">
          <span class="entry-no">{String(row.entryNo).padStart(3, '0')}.</span>
          {#if row.name}
            <span class="entry-name">{row.name}</span>
          {/if}
        </div>
        {#if row.note}
          <p class="entry-note">{row.note}</p>
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
    gap: 10px;
  }
  .entry-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .entry-header {
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
  .entry-note {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0 0 0 38px;
  }
</style>
