<script lang="ts">
  import { getZone } from '../game/game';
  import { ZONE_HERO_IMAGE } from './data/zoneHero';

  let zone = $derived(getZone());
  let image = $derived(ZONE_HERO_IMAGE[zone.zoneId]);
</script>

{#key image}
  <div class="hero" style="background-image: url({image})">
    <div class="scrim"></div>
    <div class="title">
      <h2 class="zone-name">{zone.zoneName}</h2>
      <p class="subzone-name">{zone.name}</p>
    </div>
  </div>
{/key}

<style>
  .hero {
    position: relative;
    aspect-ratio: 3 / 1;
    background-size: cover;
    background-position: center;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
    animation: fade-in 600ms ease both;
  }
  /* Always a dark scrim regardless of light/dark theme - the art itself
     doesn't flip with the theme, so the title text below is fixed light
     colors rather than the usual --ink tokens (those are calibrated
     against --page, not against arbitrary photographic art). */
  .scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0) 65%);
  }
  .title {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 12px;
  }
  .zone-name {
    margin: 0;
    font: 700 20px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #f5f1e6;
  }
  .subzone-name {
    margin: 2px 0 0;
    font: 600 14px/1.2 var(--font-ui);
    color: rgba(245, 241, 230, 0.75);
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
