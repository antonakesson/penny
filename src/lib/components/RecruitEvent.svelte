<script lang="ts">
  import { getEncounter, getRecruitRuntime, click, setHolding } from '../game/game';
  import { EVENTS, type PetEventDef } from '../game/data/events';

  let encounter = $derived(getEncounter());
  let def = $derived(encounter.kind === 'pet' ? (EVENTS[encounter.id] as PetEventDef) : null);
  let runtime = $derived(getRecruitRuntime());
  let stage = $derived(def ? def.stages[runtime.stageIndex] : null);
  let isHoldStage = $derived(stage?.interaction === 'hold');

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 100);
    return () => clearInterval(id);
  });

  let remainingMs = $derived.by(() => {
    if (!stage) return 0;
    if (isHoldStage) return Math.max(0, stage.durationMs - runtime.heldMs);
    return runtime.stageStartedAt !== null ? Math.max(0, stage.durationMs - (now - runtime.stageStartedAt)) : 0;
  });
  let pct = $derived.by(() => {
    if (!stage) return 0;
    if (isHoldStage) return Math.min(100, (runtime.heldMs / stage.durationMs) * 100);
    return runtime.stageStartedAt !== null ? Math.min(100, ((now - runtime.stageStartedAt) / stage.durationMs) * 100) : 0;
  });

  function stopHolding() {
    if (isHoldStage) setHolding(false);
  }
</script>

{#if def && stage}
  <section class="recruit" class:done={runtime.status === 'resolved'}>
    <p class="entry-no">Entry No. {String(def.entryNo).padStart(3, '0')}</p>
    {#if def.image}<img class="art" src={def.image} alt={def.name} />{/if}
    <h1 class="name">{def.name}</h1>
    {#if stage.lore}<p class="lore">{stage.lore}</p>{/if}

    {#if isHoldStage}
      <button
        class="hold-button"
        class:holding={runtime.isHolding}
        onpointerdown={() => setHolding(true)}
        onpointerup={stopHolding}
        onpointerleave={stopHolding}
        onpointercancel={stopHolding}
      >
        {runtime.isHolding ? 'Keep holding…' : `Hold to ${stage.label.toLowerCase()}`}
      </button>
      <div class="progress-bar">
        <div class="progress-fill hold" style="width: {pct}%"></div>
      </div>
      <p class="timer">{(remainingMs / 1000).toFixed(0)}s of resolve left</p>
    {:else if runtime.stageStartedAt === null}
      <button onclick={click}>{stage.label}</button>
    {:else}
      <div class="progress-bar">
        <div class="progress-fill" style="width: {pct}%"></div>
      </div>
      <p class="timer">{stage.label}… {(remainingMs / 1000).toFixed(0)}s remaining</p>
    {/if}
  </section>
{/if}

<style>
  .recruit {
    margin-bottom: 20px;
    max-width: 340px;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  .recruit.done {
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
  .hold-button {
    width: 100%;
    touch-action: none;
    user-select: none;
  }
  .hold-button.holding {
    background: var(--wax);
    color: var(--wax-on);
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
    background: var(--accent);
    transition: width 0.15s linear;
  }
  .progress-fill.hold {
    background: var(--wax);
    transition: width 0.1s linear;
  }
  .timer {
    margin: 8px 0 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--ink-faint);
  }
</style>
