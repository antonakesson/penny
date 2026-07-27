<script lang="ts">
  import { getZone, getIdleMs } from '../game/game';
  import { PACING_IDLE_MS } from '../game/config';

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  // Reads `now` so this recomputes on the interval above — getIdleMs() itself
  // reads the real clock, not a reactive signal, so nothing would otherwise
  // tell Svelte to re-run this derivation as time passes.
  let idle = $derived.by(() => {
    void now;
    return getIdleMs() >= PACING_IDLE_MS;
  });
</script>

<section class="zone">
  <p class="pacing">
    <span class:current={!idle}>Active</span>
    <span class="sep">·</span>
    <span class:current={idle}>Idle</span>
  </p>
  <h2>{getZone().name}</h2>
  <p class="lore">{getZone().description}</p>
</section>

<style>
  .zone {
    margin-bottom: 28px;
  }
  .pacing {
    display: flex;
    align-items: center;
    gap: 8px;
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 8px;
  }
  .pacing .sep {
    opacity: 0.5;
  }
  .pacing .current {
    color: var(--accent-text);
  }
  h2 {
    margin: 0 0 4px;
  }
  .lore {
    font-style: italic;
    font-size: 16px;
    color: var(--ink-faint);
    max-width: 60ch;
  }
</style>
