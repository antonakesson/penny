<script lang="ts">
  import { getEncounter, getTreasureRuntime, startInvestigating } from '../game/game';
  import { EVENTS, type TreasureEventDef } from '../game/data/events';

  let encounter = $derived(getEncounter());
  let def = $derived(encounter.kind === 'treasure' ? (EVENTS[encounter.id] as TreasureEventDef) : null);
  let runtime = $derived(getTreasureRuntime());

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 100);
    return () => clearInterval(id);
  });

  let remainingMs = $derived(
    def && runtime.startedAt !== null ? Math.max(0, def.durationMs - (now - runtime.startedAt)) : 0
  );
  let pct = $derived(def && runtime.startedAt !== null ? Math.max(0, (remainingMs / def.durationMs) * 100) : 0);
</script>

{#if def}
  <section class="treasure" class:done={runtime.status === 'resolved'}>
    <p class="entry-no">Entry No. {String(def.entryNo).padStart(3, '0')}</p>
    {#if def.image}<img class="art" src={def.image} alt={def.name} />{/if}
    <h1 class="name">{def.name}</h1>
    <p class="lore">{def.lore}</p>
    {#if runtime.startedAt === null}
      <button onclick={startInvestigating}>{def.investigateLabel}</button>
    {:else}
      <div class="progress-bar">
        <div class="progress-fill" style="width: {pct}%"></div>
      </div>
      <p class="timer">{(remainingMs / 1000).toFixed(0)}s remaining</p>
    {/if}
  </section>
{/if}

<style>
  .treasure {
    margin-bottom: 20px;
    max-width: 340px;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  .treasure.done {
    opacity: 0.4;
  }
  .entry-no {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .art {
    display: block;
    width: 100%;
    max-height: 160px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .name {
    font: 700 20px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0 0 8px;
  }
  .lore {
    font-style: italic;
    color: var(--ink-faint);
    margin: 0 0 12px;
  }
  .progress-bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--rarity-uncommon);
    transition: width 0.15s linear;
  }
  .timer {
    margin: 8px 0 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--ink-faint);
  }
</style>
