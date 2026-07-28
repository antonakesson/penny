<script lang="ts">
  import { getZone } from '../game/game';

  let zone = $derived(getZone());
</script>

<section class="zone">
  <h2>{zone.name}</h2>
  <p class="lore">{zone.description}</p>
  {#if zone.quote}
    <blockquote class="quote">
      <p class="quote-text">"{zone.quote.text}"</p>
      <cite class="quote-attribution">— {zone.quote.attribution}</cite>
    </blockquote>
  {/if}
</section>

<style>
  .zone {
    margin-bottom: 28px;
  }
  h2 {
    margin: 0 0 4px;
  }
  .lore {
    font-style: italic;
    font-size: 16px;
    color: var(--ink);
    max-width: 60ch;
  }
  .quote {
    margin: 12px 0 0;
    padding-left: 12px;
    border-left: 2px solid var(--wax);
    max-width: 60ch;
  }
  .quote-text {
    font-style: italic;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink-faint);
    margin: 0;
  }
  .quote-attribution {
    display: block;
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink-faint);
    font-style: normal;
    margin-top: 4px;
  }
</style>
