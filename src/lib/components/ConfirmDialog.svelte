<script lang="ts">
  import Modal from './Modal.svelte';

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
</script>

<Modal labelledby="confirm-title" closeLabel="Cancel" onDismiss={onCancel}>
  <h2 id="confirm-title">{title}</h2>
  <p>{message}</p>
  <div class="actions">
    <button class="cancel" onclick={onCancel}>Cancel</button>
    <button class="confirm" onclick={onConfirm}>{confirmLabel}</button>
  </div>
</Modal>

<style>
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
