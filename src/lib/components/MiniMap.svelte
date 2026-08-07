<script lang="ts">
  import SignalTrace from './SignalTrace.svelte';

  // The "where am I / which way am I facing" wrapper - direction used to
  // live in its own arrow box beside SignalTrace, but the trace's centered
  // "you are here" marker is itself an arrow now (see SignalTrace.svelte),
  // so this wrapper is down to one child. Kept anyway rather than inlined
  // into App.svelte - a future addition to this reading (a real compass, a
  // zone-progress marker) still has one obvious place to slot in.
</script>

<div class="mini-map">
  <SignalTrace />
</div>

<style>
  .mini-map {
    display: flex;
    align-items: center;
    max-width: 340px;
    margin-bottom: 20px;
  }
</style>
