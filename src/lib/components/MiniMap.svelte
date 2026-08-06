<script lang="ts">
  import SignalTrace from './SignalTrace.svelte';
  import { isReturning } from '../game/game';

  // The "where am I / which way am I facing" wrapper - SignalTrace (the
  // terrain/difficulty trace) and the direction arrow live side by side
  // here so a future addition to this reading (a real compass, a
  // zone-progress marker) has one obvious place to slot in, rather than
  // App.svelte growing another top-level sibling per widget.
  let returning = $derived(isReturning());
</script>

<div class="mini-map">
  <SignalTrace />
  <div class="direction" class:returning title={returning ? 'Walking back' : 'Walking forward'}>
    <span class="arrow">{returning ? '◀' : '▶'}</span>
  </div>
</div>

<style>
  .mini-map {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 340px;
    margin-bottom: 20px;
  }
  .direction {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--page);
  }
  .direction .arrow {
    font: 700 14px/1 var(--font-ui);
    color: var(--ink-faint);
  }
  /* Same wax-on-deviation convention Skills' active tile uses - forward
     is the default/expected state and stays neutral, returning is the one
     worth flagging. */
  .direction.returning {
    border-color: var(--wax);
    background: color-mix(in srgb, var(--wax) 14%, var(--page));
  }
  .direction.returning .arrow {
    color: var(--wax);
  }
</style>
