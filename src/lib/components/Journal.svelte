<script lang="ts">
  import { getJournalEntries } from '../game/game';

  let entries = $derived(getJournalEntries());
</script>

{#if entries.length === 0}
  <p class="empty">Nothing written yet.</p>
{:else}
  <ul class="entries">
    {#each entries as entry (entry)}
      <li class="entry">{entry.text}</li>
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
  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .entry {
    font-family: var(--font-body);
    color: var(--ink);
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .entry:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
</style>
