<script lang="ts">
  import type { Snippet } from 'svelte';

  // dismissOnEnter defaults off - a multi-action dialog with a destructive
  // confirm (Reset save) must not let Enter double as an accidental confirm.
  let {
    labelledby,
    closeLabel = 'Dismiss',
    dismissOnEnter = false,
    onDismiss,
    children,
  }: {
    labelledby: string;
    closeLabel?: string;
    dismissOnEnter?: boolean;
    onDismiss: () => void;
    children: Snippet;
  } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || (dismissOnEnter && event.key === 'Enter')) onDismiss();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop">
  <button class="backdrop-close" aria-label={closeLabel} onclick={onDismiss}></button>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby={labelledby}
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10;
  }
  .backdrop-close {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }
  .dialog {
    position: relative;
    width: 100%;
    max-width: 340px;
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 12px 32px var(--shadow);
  }
</style>
