# Vessel Progression (Feature Spec, Stub)

Status: **stub, not planned in detail yet**.

## Idea

The vessel is what actually carries the player (and, per
`FEATURE_SLOTS_UPGRADE.md`'s shared-location design, all tool slots)
between zones. Right now it's implicit and free — any zone reachable
by an edge in `zones.js` is reachable, no gear required. That won't
hold once zones need to gate on vessel tier (see `zones.js`'s note on
`requires`-gated edges: raft tiers, arctic sailing, hollow-earth
transit, eventually interplanetary).

Rough tier sketch, names placeholder:

1. **Walking** — starting state, whatever the free starter edge
   already represents.
2. **Raft** — first real vessel, unlocks `requires`-gated edges the
   starter leg doesn't cover.
3. **Raft with amenities** — same raft, upgraded; probably storage,
   speed, or survival-stat effects rather than new edges.
4. **Unsinkable Raft (TM)** — late-tier, likely unlocks the
   furthest-gated edges (arctic/hollow-earth/interplanetary per
   `zones.js`'s forward-looking comment).

## Open questions (TBD)

- How do tiers gate edges — a `requires: 'raftTier2'` field on
  `ZONE_EDGES` checked in `findRoute` (as `zones.js` already
  anticipates), or something else?
- How is a tier acquired — craft (fits `FEATURE_ITEM_SINK.md`'s craft
  angle, "raft upgrades" is already listed there), zone-gated find, or
  both?
- Do amenities affect anything beyond edge access (speed, survival
  drain, tool-slot capacity)?

Deliberately not designed further until `FEATURE_SLOTS_UPGRADE.md`'s
vessel/shared-location plumbing actually lands — this is the next
layer on top of that, not a prerequisite for it.
