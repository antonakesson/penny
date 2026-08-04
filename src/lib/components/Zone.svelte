<script lang="ts">
  import { getZone, getEncounter } from '../game/game';
  import { SUBZONE_FLAVOR, ENCOUNTER_FLAVOR, type Quote } from './data/flavor';
  import type { EncounterId } from '../game/data/encounters';

  const FADE_OUT_MS = 1000;
  const FADE_IN_MS = 3000;
  const QUOTE_STAGGER_MS = 400; // quote starts its own fade-out this long after the description

  let zone = $derived(getZone());
  let encounter = $derived(getEncounter());

  // What's actually painted, plus its current opacity/fade duration. Sticky,
  // not derived - whichever slot last had something to say owns the display
  // until something else speaks up (a subzone with nothing authored yet
  // doesn't blank out whatever the previous one left showing). A single
  // persistent element with its opacity toggled - not two elements swapped
  // via a keyed transition block - so old and new text are never laid out
  // at the same time (that's what looked like a jump/snap before).
  let shownDescription = $state<string | undefined>(undefined);
  let descriptionOpacity = $state(1);
  let descriptionFadeMs = $state(FADE_IN_MS);
  let descriptionTimer: ReturnType<typeof setTimeout> | undefined;

  let shownQuote = $state<Quote | undefined>(undefined);
  let quoteOpacity = $state(1);
  let quoteFadeMs = $state(FADE_IN_MS);
  let quoteTimer: ReturnType<typeof setTimeout> | undefined;

  let previousSubZoneId: string | undefined;

  function crossfadeDescription(next: string) {
    clearTimeout(descriptionTimer);
    descriptionFadeMs = FADE_OUT_MS;
    descriptionOpacity = 0;
    descriptionTimer = setTimeout(() => {
      shownDescription = next;
      descriptionFadeMs = FADE_IN_MS;
      descriptionOpacity = 1;
    }, FADE_OUT_MS);
  }

  function crossfadeQuote(next: Quote) {
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(() => {
      quoteFadeMs = FADE_OUT_MS;
      quoteOpacity = 0;
      quoteTimer = setTimeout(() => {
        shownQuote = next;
        quoteFadeMs = FADE_IN_MS;
        quoteOpacity = 1;
      }, FADE_OUT_MS);
    }, QUOTE_STAGGER_MS);
  }

  // New subzone: only overwrites a slot the subzone actually has something
  // for. A DRAFT subzone with nothing authored yet (deepWoods) has nothing
  // to say, so it says nothing - leaving the previous subzone's line (and
  // any encounter quote layered on top of it) exactly as it was, instead of
  // blanking the panel the moment the player walks past the authored edge.
  // The crossfade is reserved for that same "actually said something new"
  // case (and skipped on first mount, when there's nothing on screen yet to
  // fade out from).
  $effect(() => {
    const flavor = SUBZONE_FLAVOR[zone.zoneId]?.[zone.subZoneId];
    const enteredNewSubZone = zone.subZoneId !== previousSubZoneId;
    if (flavor?.description) {
      if (enteredNewSubZone && shownDescription !== undefined) crossfadeDescription(flavor.description);
      else shownDescription = flavor.description;
    }
    if (flavor?.quote) {
      if (enteredNewSubZone && shownQuote !== undefined) crossfadeQuote(flavor.quote);
      else shownQuote = flavor.quote;
    }
    previousSubZoneId = zone.subZoneId;
  });

  // An encounter with something to say overwrites just the quote - most
  // encounters (a boar, a badger) have no entry and leave it alone. Instant,
  // not crossfaded - the crossfade is specifically the "entering a new
  // subzone" beat, not every quote change.
  $effect(() => {
    const encounterQuote = ENCOUNTER_FLAVOR[encounter.id as EncounterId]?.quote;
    if (encounterQuote) {
      clearTimeout(quoteTimer);
      quoteFadeMs = FADE_IN_MS;
      quoteOpacity = 1;
      shownQuote = encounterQuote;
    }
  });
</script>

<section class="zone">
  {#if shownDescription}
    <p class="lore" style="opacity: {descriptionOpacity}; transition-duration: {descriptionFadeMs}ms;">
      {shownDescription}
    </p>
  {/if}
  {#if shownQuote}
    <blockquote class="quote" style="opacity: {quoteOpacity}; transition-duration: {quoteFadeMs}ms;">
      <p class="quote-text">"{shownQuote.text}"</p>
      <cite class="quote-attribution">— {shownQuote.attribution}</cite>
    </blockquote>
  {/if}
</section>

<style>
  .zone {
    margin-bottom: 28px;
  }
  .lore {
    font-style: italic;
    font-size: 16px;
    line-height: 1.5;
    color: var(--ink);
    max-width: 60ch;
    transition-property: opacity;
    transition-timing-function: ease-in-out;
  }
  .quote {
    margin: 12px 0 0;
    padding-left: 12px;
    border-left: 2px solid var(--wax);
    max-width: 60ch;
    transition-property: opacity;
    transition-timing-function: ease-in-out;
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
