<script lang="ts">
  import Modal from './Modal.svelte';

  let {
    title,
    message,
    onDismiss,
  }: {
    title: string;
    message: string;
    onDismiss: () => void;
  } = $props();
</script>

<Modal labelledby="unlock-title" dismissOnEnter onDismiss={onDismiss}>
  <p class="eyebrow">Feature Unlocked</p>
  <h2 id="unlock-title">{title}</h2>
  <p class="message">{message}</p>
  <div class="actions">
    <button class="confirm" onclick={onDismiss}>Neat!</button>
  </div>
</Modal>

<style>
  .eyebrow {
    font: 700 11px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 8px;
  }
  h2 {
    font: 700 16px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0 0 10px;
  }
  .message {
    font-family: var(--font-body);
    color: var(--ink);
    margin: 0 0 20px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  button {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    border-radius: 6px;
    padding: 10px 14px;
  }
  .confirm {
    color: var(--wax-on);
    background: var(--wax);
    border: 1px solid var(--wax);
  }
</style>
