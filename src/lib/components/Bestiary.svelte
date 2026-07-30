<script lang="ts">
  import { ENCOUNTERS, type EncounterDef } from '../game/data/encounters';
  import { isMonsterDiscovered, getMaxDiscoveredEntryNo } from '../game/game';

  // Investigation kinds don't have one static description - they walk
  // through descriptions[] live as progress advances (see Discovery.svelte).
  // Browsed after the fact here, so the full run of beats reads as one
  // recap paragraph instead of picking just one.
  function descriptionFor(def: EncounterDef): string | undefined {
    return def.kind === 'investigation' ? def.descriptions?.join(' ') : def.description;
  }

  const nameByEntryNo = Object.fromEntries(Object.values(ENCOUNTERS).map((m) => [m.entryNo, m.name]));
  const descriptionByEntryNo = Object.fromEntries(
    Object.values(ENCOUNTERS).map((m) => [m.entryNo, descriptionFor(m as EncounterDef)])
  );

  let maxEntryNo = $derived(getMaxDiscoveredEntryNo());
  let rows = $derived(
    Array.from({ length: maxEntryNo }, (_, i) => {
      const entryNo = i + 1;
      const discovered = isMonsterDiscovered(entryNo);
      return {
        entryNo,
        name: discovered ? nameByEntryNo[entryNo] : null,
        // Bestiary is browsed voluntarily, not shoved into every kill - the
        // one venue where a monster's lore note can repeat without wearing
        // out its welcome. See Monster.svelte's live encounter panel for
        // the other venue (always-visible, reserved for one-shot reveals).
        description: discovered ? descriptionByEntryNo[entryNo] : undefined,
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
        {#if row.description}
          <p class="entry-description">{row.description}</p>
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
  .entry-description {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0 0 0 38px;
  }
</style>
