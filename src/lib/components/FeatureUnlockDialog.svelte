<script lang="ts">
  let {
    title,
    message,
    onDismiss,
  }: {
    title: string;
    message: string;
    onDismiss: () => void;
  } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter') onDismiss();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop">
  <button class="backdrop-close" aria-label="Dismiss" onclick={onDismiss}></button>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="unlock-title"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    <p class="eyebrow">Feature Unlocked</p>
    <h2 id="unlock-title">{title}</h2>
    <p class="message">{message}</p>
    <div class="actions">
      <button class="confirm" onclick={onDismiss}>Neat!</button>
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
