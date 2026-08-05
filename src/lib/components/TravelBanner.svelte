<script lang="ts">
  import Toggle from './Toggle.svelte';
  import { isReturning, setReturning } from '../game/game';

  // A standing mode, not a one-shot action - every encounter that resolves
  // while this is on sends advance() the other way, silently, until it's
  // switched off again. That's why this gets ambient banner treatment
  // instead of a quiet control tucked into SignalTrace: state that keeps
  // acting after you've stopped looking at it needs to stay visible.
  let returning = $derived(isReturning());
</script>

<div class="travel-banner" class:active={returning}>
  <span class="label">{returning ? 'Walking back' : 'Walking forward'}</span>
  <Toggle label="Return" checked={returning} onchange={setReturning} />
</div>

<style>
  .travel-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--page-sunken);
    border: 1px solid var(--border);
    margin-bottom: 16px;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }
  .travel-banner.active {
    background: color-mix(in srgb, var(--wax) 18%, var(--page-sunken));
    border-color: var(--wax);
  }
  .label {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.03em;
    color: var(--ink-faint);
  }
  .travel-banner.active .label {
    color: var(--wax);
  }
</style>
