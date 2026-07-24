<script lang="ts">
  import { getZone } from '../game/game';
</script>

<section class="zone">
  <h2>{getZone().name}</h2>
  <p class="lore">{getZone().description}</p>
</section>

<style>
  .zone {
    margin-bottom: 28px;
  }
  h2 {
    margin: 0 0 4px;
  }
  .lore {
    font-style: italic;
    font-size: 16px;
    color: var(--ink-faint);
    max-width: 60ch;
  }
</style>
