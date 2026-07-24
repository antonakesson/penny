<script lang="ts">
  let {
    title,
    message,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
  }: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop">
  <button class="backdrop-close" aria-label="Cancel" onclick={onCancel}></button>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    <h2 id="confirm-title">{title}</h2>
    <p>{message}</p>
    <div class="actions">
      <button class="cancel" onclick={onCancel}>Cancel</button>
      <button class="confirm" onclick={onConfirm}>{confirmLabel}</button>
    </div>
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
  h2 {
    font: 700 16px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0 0 10px;
  }
  p {
    font-family: var(--font-body);
    color: var(--ink);
    margin: 0 0 20px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    border-radius: 6px;
    padding: 10px 14px;
  }
  .cancel {
    color: var(--ink);
    background: var(--page-sunken);
    border: 1px solid var(--border);
  }
  .confirm {
    color: var(--wax-on);
    background: var(--wax);
    border: 1px solid var(--wax);
  }
</style>
