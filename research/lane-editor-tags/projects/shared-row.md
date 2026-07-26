# d-wasserman/shared-row — Slice specification (ROW vocabulary)

Referenced in [AB Street discussion #789](../sources/abstreet-discussion-789.md) by @dabreegster and @d-wasserman. **Not an OSM tag parser** — a target schema for consolidated street cross-sections. **Fetched 2026-07-25.**

| Field | Value |
|-------|-------|
| **Repo** | https://github.com/d-wasserman/shared-row |
| **Slice spec** | https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md |
| **Author** | Seth Wasserman (@d-wasserman) |
| **Relation to OSM** | Derived / consolidated centreline model (SharedStreets-style geometry); OSM ways are inputs to separate tooling |

@d-wasserman (#789): transformer code has value as reference; limited bandwidth to contribute to osm2lanes directly.

---

## Core model

GeoJSON feature per street segment:

| Field | Description |
|-------|-------------|
| `geometry` | SharedStreets-compliant LineString (WGS84); L/R orientation follows vertex order |
| `sharedstreetid` | Unique segment ID (no dual carriageways in one segment) |
| `slices[]` | Left-to-right ROW slices in `properties` |

Each slice:

| Attribute | Type | Notes |
|-----------|------|-------|
| `type` | string | See slice types below |
| `width` | float | Metres |
| `height` | float | cm relative to road surface (default 0) |
| `direction` | `forward` \| `reverse` | Relative to geometry |
| `material` | string | e.g. asphalt, concrete; type-specific defaults |
| `meta` | JSON | Optional: colour, transitions, accessibility, mode mixing |

Global meta on all slices: `material`, `color`, `height`, `transitions` (edge + start/end junction transition types: angled, s-shaped, offset, semi-circle).

---

## Slice types (summary)

### Dedicated automotive

| Type | Purpose |
|------|---------|
| `drive_lane` | Through automobile lane; optional `sharrow` meta |
| `turn_lane` | Turn pocket; `begin_depth`, `end_depth`, `begin/end_movements_allowed` (left\|right\|through), `remainder_allocation` |

### Dedicated non-automotive

| Type | Purpose |
|------|---------|
| `sidewalk` | Pedestrian; `accessible` meta |
| `bike_lane` | Cycle through-lane |
| `bus_lane` | Bus; `brt`, `bikes_allowed`, `taxi_allowed` |
| `transit` | Fixed rail; `type` (trolley/light/heavy), mode mixing flags |
| `path` | Shared bike+foot; `bikes_allowed`, `pedestrians_allowed` |

### Mixed

| Type | Purpose |
|------|---------|
| `limitless` | Non-automotive through (any mode) |

### Curb zone

| Type | Purpose |
|------|---------|
| `flex_zone`, `parking`, `parklet`, `commercial_loading`, `passenger_loading`, `transit_stop`, `commercial_activity`, `bike_parking`, `bike_share`, `dockless_parking`, `construction_zone`, `tow_away_zone` | Point-to-point curb allocations |

### Miscellaneous

| Type | Purpose |
|------|---------|
| `median` | Centre; `type`: paint, curb, vegetated, … |
| `buffer` | Protection for multimodal lanes; posts, planters, … |
| `temporary` | Events/construction; `barrier_type` |
| `transit_shelter`, `planting_strip`, `filter_strip`, `canal` | |

---

## Relevance for our lane editor

1. **Target schema inspiration** — richer than osm2lanes `travel|parking|shoulder|separator`; explicit curb-zone and turn-pocket semantics.
2. **Mode mixing as meta** — bus lane + `taxi_allowed` parallels `bus:lanes` / access tags without OSM pipe syntax.
3. **Transitions** — formal edge transitions between slices (broken white, curb, gutter) — aligns with separator/markings research.
4. **Not a round-trip OSM format** — mapping OSM `:lanes` → slices and back is a separate design task; #789 discussed this as complementary vocabulary.
5. **Multi-way consolidation** — shared centreline ID assumes pre-merged street; matches @tordans’s #789 multi-way goal at schema level, not parser level.

---

## Mapping hints (informal, not spec-defined)

| OSM concept | Likely slice type |
|-------------|-------------------|
| `lanes` + motor traffic | `drive_lane` |
| `turn:lanes=*` | `turn_lane` + movement meta |
| `cycleway=lane/track` | `bike_lane` or `path` |
| `bus:lanes` / `psv:lanes` | `bus_lane` |
| `parking:lane=*` | `parking` (curb zone) |
| `sidewalk=*` | `sidewalk` |
| Separated cycle track on parallel way | separate feature / not on carriageway slice list |

**Do not invent** precise OSM→slice rules without implementation code in shared-row repo.

---

## Sources

- https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md
- https://github.com/a-b-street/abstreet/discussions/789
- https://github.com/d-wasserman/shared-row/issues/11 (OSM Derived Shared-ROW Data — cited in #789 opener)
