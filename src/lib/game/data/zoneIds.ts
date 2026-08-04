// Split out of zones.ts on purpose. ZoneId used to be `keyof typeof ZONES`,
// but ZONES's own shape now reaches into EncounterId (via PoiMember), which
// resolves through ENCOUNTERS, which reaches back into ZoneId (via
// CrossroadBranch.destination) - a genuine type cycle, not just a circular
// import. Keeping ZoneId as a plain literal union here (independent of
// ZONES) breaks that cycle. zones.ts re-exports this and enforces the two
// stay in sync via `satisfies Record<ZoneId, ZoneDef>` on ZONES itself - so
// this only needs hand-updating, and drifting forgets to, when a zone is
// added or removed.
export type ZoneId = 'zone1' | 'zone2' | 'zone3';
