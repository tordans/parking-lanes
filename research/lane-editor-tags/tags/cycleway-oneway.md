# `cycleway:*:oneway` — oneway vs travel direction

Discussion note for how this editor interprets `cycleway:left|right|both:oneway=*`. Complements [bicycle-lanes.md](bicycle-lanes.md).

**Audit example:** [`/audit-lanes/karl-marx-dual-split`](https://osmberlin.github.io/street-space-editor/audit-lanes/karl-marx-dual-split) — bidirectional Karl-Marx-Straße with advisory cycle lanes (`way/1002238497`, `way/37184618`) tagged `cycleway:both=lane` + `cycleway:both:oneway=yes`, then split to dual carriageways.

## Claim (our definition)

`cycleway:both:oneway=yes` expands to **both sides oneway**:

- `cycleway:left:oneway=yes`
- `cycleway:right:oneway=yes`

`oneway=yes` means **the cycleway on that side is oneway** (not bidirectional). It does **not** mean “travel OSM-forward on both sides.”

**Travel direction still follows the motor traffic on that side of the road** (same as cars):

| Side (RHT / DE) | Motor direction | CW with `oneway=yes` |
|-----------------|-----------------|----------------------|
| `*:right` | forward (with way) | **forward** |
| `*:left` | backward (against way) | **backward** |

So on a normal two-way German street, left CW ↑ and right CW ↓ in our lanes diagram (forward = down the page), matching the adjacent motor lanes.

`oneway=-1` / `reverse` means **contraflow** relative to the OSM way (travel **backward**). `oneway=no` means **both-ways** on that side.

## Why this comes up

Field mistag / intuition: mappers (and some tools) write `cycleway:both:oneway=yes` to mean “each side has a oneway cycle lane with traffic.” That is what we want to **draw**.

The [OSM wiki Key:cycleway:right:oneway](https://wiki.openstreetmap.org/wiki/Key:cycleway:right:oneway) documents a **stricter** reading: `yes` = OSM-forward on that side, and `cycleway:both:oneway=yes` therefore forces **both** sides OSM-forward (called a “very uncommon layout”). The wiki also warns that many mappers wrongly assume `both:oneway=yes` for the normal RHT layout, which should be either **untagged** (defaults: right=`yes`, left=`-1`) or explicit `cycleway:right:oneway=yes` + `cycleway:left:oneway=-1`.

| Tagging | Wiki literal draw | Our editor draw (RHT bi) |
|---------|-------------------|---------------------------|
| (no `*:oneway`) | left←back, right←fwd | same |
| `both:oneway=yes` | **both** OSM-forward | left←back, right←fwd (oneway **with cars**) |
| `left:oneway=-1` + `right:oneway=yes` | left←back, right←fwd | same |
| `both:oneway=no` | both-ways each side | both-ways each side |

We intentionally follow the **with-cars** reading for `*:oneway=yes` so Karl-Marx-style data and mapper intent match the sketch. True “both sides OSM-forward” remains expressible only as an uncommon physical layout; if we ever need wiki-literal both-forward as a first-class case, add an explicit product decision (and likely a QA warning).

## `oneway=-1` on the parent highway

Parent `oneway=-1` / `reverse` is handled by **tag remirror** before parse (`effectiveTagsForParse` / `mirrorTags`): left↔right, forward↔backward, then treat as a normal oneway. Cycleway sides stay consistent with remirrored motor directions.

## Implementation

- Derivation: `deriveCarriagewayCycleDirection` in `packages/osm-lane-diagram/src/from-tags.ts`
- Fixtures: `karl-marx-dual-split`, `karl-marx-bi-to-dual`, `karl-marx-crossing-turns`, …
- Orientation contract: [docs/lanes-road-space-approach.md](../../../docs/lanes-road-space-approach.md) §9 (diagram forward = down)

## Open for discussion

1. Soft QA warning when bidirectional + `cycleway:both:oneway=yes` (wiki calls it uncommon / often mistagged)?
2. Should writes prefer omitting redundant `:oneway=yes` and only emit `-1` / `no` exceptions (StreetComplete-style)?
3. LHT: with-cars flips (left←forward, right←backward) via `driving_side` — confirm when we leave DE/EU default.
