import { CHOICE_SETTLE_MS } from '../game/config';

// A choice that just appeared ignores input for a moment. The whole page is
// an attack surface (see App.svelte), so a player clicking in attack rhythm
// when a monster dies and a conversation spawns in its place would otherwise
// land that in-flight click on whatever option happened to render under the
// cursor - picking a dialog branch they never read.
//
// Deliberately not solved by moving choices out from under the cursor: any
// layout can be unlucky, and the same accident reaches the digit keybinds
// too. A short deaf window covers every route in.
//
// `key` is whatever identifies "a different set of choices than a moment
// ago" - a dialog node id, an encounter instance. Re-reads on every change,
// so advancing a conversation re-arms the window at each node rather than
// only when the encounter first appears.
export function createChoiceSettle(key: () => unknown) {
  let settled = $state(false);

  $effect(() => {
    key();
    settled = false;
    const id = setTimeout(() => (settled = true), CHOICE_SETTLE_MS);
    return () => clearTimeout(id);
  });

  return {
    get settled() {
      return settled;
    },
  };
}
