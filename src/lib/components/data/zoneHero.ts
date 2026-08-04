import type { ZoneId } from '../../game/data/zoneIds';
import zone1 from '../../../assets/zones/zone1.webp';
import zone2 from '../../../assets/zones/zone2.webp';
import zone3 from '../../../assets/zones/zone3.webp';

// Presentation only - same boundary as data/flavor.ts and data/zoneColors.css:
// nothing in game/* reads this, zones.ts only needs to know a zone exists,
// not what it looks like. Vite resolves each import to a hashed URL at
// build time, so HeroBanner.svelte never touches a raw path.
export const ZONE_HERO_IMAGE: Record<ZoneId, string> = {
  zone1,
  zone2,
  zone3,
};
