# osm2streets (active)

**See also:** [muv-osm.md](./muv-osm.md) — external `muv-osm` crate that performs per-way lane parsing (since [PR #233](https://github.com/a-b-street/osm2streets/pull/233)); osm2streets `osm2lanes/src/algorithm.rs` is the translation layer.

Research snapshot for [a-b-street/osm2streets](https://github.com/a-b-street/osm2streets). Sources: README, `CHANGES.md`, `CONTRIBUTING.md`, `docs/how_it_works.md`, `osm2lanes/src/algorithm.rs`, `osm2streets/src/transform/mod.rs`, `tests/README.md`.

## Overview and features

`osm2streets` transforms OSM into a **simplified street network** suited to lane-level rendering, routing, and analysis — especially where OSM splits carriageways, cycletracks, and footways across parallel ways or complex intersections.

### Schema (current)

| Entity | Properties |
|--------|------------|
| **Road** | Segment between exactly two intersections; thickened linestring; **lanes left-to-right** (type, direction, width) |
| **Intersection** | Polygon linking roads at perpendicular angles; kinds include real intersections, map edges, termini, forks, connections |

**Planned** (README): turning movements, crosswalks, bike boxes, pedestrian islands, modal filters, lane width changes.

### Rendering

- GeoJSON: lane and intersection polygons
- Lane markings: lines between lanes, schematic turn arrows and access restrictions (`osm2streets/src/render/lane_markings.rs`)

### Network-level transformations

Applied via `StreetNetwork::apply_transformations` (`osm2streets/src/transform/mod.rs`):

| Transformation | Purpose |
|----------------|---------|
| `ZipSidepaths` | Snap parallel cycletracks/footways to main road (experimental; README "SnapCycleways") |
| `RemoveDisconnectedRoads` | Drop disconnected components after clipping |
| `CollapseShortRoads` | Remove `junction=intersection` stubs and roads trimmed away by intersection geometry |
| `CollapseDegenerateIntersections` | Merge two-road intersections when lanes compatible |
| `MergeDualCarriageways` | Merge parallel one-way pairs into one logical road (experimental) |

`standard_for_clipped_areas()` runs collapse short → collapse degenerate → collapse short again. Does **not** include dual-carriageway merge or sidepath zip by default.

**Import pipeline** (`docs/how_it_works.md`): OSM extract → split ways at shared nodes → clip to boundary → match crossings/barriers → **lanes filled from tags** → optional transforms → geometry update.

## Where lane parsing lives

| Component | Path | Role |
|-----------|------|------|
| **osm2lanes crate** (in-repo) | `osm2lanes/` | Per-way lane specs from tags; used during road creation |
| Lane algorithm | `osm2lanes/src/algorithm.rs` | `get_lane_specs_ltr(tags, MapConfig)` |
| OSM helpers | `osm2lanes/src/osm.rs` | `HIGHWAY` constant |
| Lane edits (A/B Street scenarios) | `osm2lanes/src/edit/` | add bike lanes, one-way changes, etc. |
| Placement | `osm2lanes/src/placement.rs` | `placement:*` tag handling |
| Turns | `osm2lanes/src/turns.rs` | Turn direction from lane access |
| **osm2lanes-js** | `osm2lanes-js/` | WASM `getLaneSpecs(tags, config)` → JSON lane specs |
| **osm2streets-js** | `osm2streets-js/` | Full street network WASM API + GeoJSON rendering |
| Legacy reference | README still links `osm2streets/src/lanes/classic.rs` — **file not on current `main`** |

### Active parser vs archived osm2lanes

Current `algorithm.rs` delegates to **`muv_osm`** (`lanes()` function) with country code + driving side, then maps `muv_osm` lane variants to osm2streets `LaneSpec` / `LaneType`:

| muv_osm / Rank | osm2streets `LaneType` |
|----------------|------------------------|
| Motorcar designated | `Driving` |
| Bus designated | `Bus` |
| Bicycle + foot | `SharedUse` |
| Bicycle designated | `Biking` |
| Foot designated | `Footway` / `Sidewalk` (sidewalk if sidepath) |
| All modes | `Shoulder` |
| Light rail / train | `LightRail` |
| Parking orientation | `Parking` (parallel/diagonal/perpendicular) |
| Kerb inference | `Buffer(Curb)` |
| Construction lifecycle | `Construction` |
| Shared left turn | `SharedLeftTurn` |

**Sidewalk inference** (`infer_sidewalk_tags`): when `MapConfig.inferred_sidewalks`, fills `sidewalk=*` from `sidewalk:left/right`, highway class, oneway, dual carriageway, etc.

**Bidirectional lanes**: `how_it_works.md` notes sidewalks and center turn lanes are forward/backward only; downstream interprets specially — **no true bidirectional lane type yet**.

## Tags and rules (lane type, direction, width, separators, parking, cycleways, sidewalks)

Tags are primarily interpreted inside **`muv_osm`** (external dependency), not duplicated in osm2streets docs. Confirmed osm2streets-specific behavior:

| Concern | Tags / rules |
|---------|----------------|
| **Driving side** | `MapConfig.driving_side`; default country from side if `country_code` empty (GB/US) |
| **Sidewalk inference** | `sidewalk`, `sidewalk:left/right`, `highway`, `oneway`, `dual_carriageway`, `foot`, `junction` |
| **Kerbs** | `MapConfig.inferred_kerbs` + muv kerb indices → curb buffers |
| **Width** | From muv lane width or `LaneSpec::typical_lane_width` |
| **Parking** | muv `ParkingLane` orientation → parallel/diagonal/perpendicular |
| **Access / turns** | muv `TravelLane` access + turn per mode; conditional access with `MapConfig.date_time` |
| **Placement** | `osm2lanes/src/placement.rs` (see `fremantle_placement` test) |
| **Highway** | `highway=*` via muv + `HIGHWAY` constant |

Archived osm2lanes tag surface (still relevant for fixtures and lane editor UX) is documented in [osm2lanes.md](./osm2lanes.md). osm2streets regression fixtures use raw OSM XML with full tag sets.

**Separators / markings**: Rendered at network level (`lane_markings.rs`), not only per-way tag parsing.

## Network transforms — implications for a per-way lane editor

| Transform | Editor implication |
|-----------|-------------------|
| **MergeDualCarriageways** | Two one-way OSM ways become one `Road` with median lanes; editing one way tag may not match displayed unified road |
| **ZipSidepaths** | Separate `footway`/`cycleway` ways snapped to carriageway; per-way editor on main highway won't show sidepath geometry unless merged |
| **CollapseDegenerateIntersections** | Short dual-carriageway spacers and compatible two-road nodes collapse; lane lists stitched across ways |
| **CollapseShortRoads** | `junction=intersection` pieces removed; tags on micro-ways may disappear from model |
| **Clip to boundary** | Partial ways at bbox edge → map-edge intersections |
| **OSM ID tracking** | Roads/intersections hold **lists** of source OSM IDs after transforms; mapping is non-trivial |

A **per-way lane editor** aligned with OSM tagging must either:

1. Edit tags on individual OSM ways and accept osm2streets preview differs until transforms run, or
2. Edit at OSM way level but preview via **per-way** `get_lane_specs_ltr` / muv only, or
3. Target the consolidated `StreetNetwork` model (not raw per-way tags).

README planned feature: robust user edits on street network even when OSM updates — not fully implemented.

## Bindings

| Binding | Path | Status |
|---------|------|--------|
| **JavaScript / WASM** | `osm2streets-js` | Primary; NPM packages `0.1.x` (`CHANGES.md`: `osm2streets-js`, `osm2streets-js-node`) |
| **Lane-only WASM** | `osm2lanes-js` | `getLaneSpecs` export |
| **Python** | `osm2streets-py` | Bindings + [example notebook](https://github.com/a-b-street/osm2streets/blob/main/osm2streets-py/osm2streets_py_test.ipynb) |
| **Java** | `osm2streets-java` | In progress (README) |
| **C++** | — | Planned (README) |
| **R** | — | Planned (README architecture diagram) |

API explicitly **not stable** — README asks contributors to get in touch before depending on it.

## Users and tools

| User / tool | Use |
|-------------|-----|
| [StreetExplorer](https://a-b-street.github.io/osm2streets/) | Interactive OSM import + inspect output |
| [A/B Street](https://abstreet.org) | Origin project; city design simulations |
| [Bus Spotting](https://github.com/dabreegster/bus_spotting) | GTFS routes snapped to roads |
| [route_snapper](https://github.com/dabreegster/route_snapper/) | MapLibre line snapping |
| [osm2streets-vector-tileserver](https://github.com/jakecoppinger/osm2streets-vector-tileserver) | Dynamic vector tiles |
| [safe-cycling-map](https://github.com/jakecoppinger/safe-cycling-map) | Mapbox example |
| [Lane editor](https://a-b-street.github.io/osm2streets/lane_editor.html) | Edit OSM tags → visual lane result |
| **Planned** | iD and JOSM plugins for detailed street display/edit |

## Source index

| Resource | URL / path |
|----------|------------|
| Repository | https://github.com/a-b-street/osm2streets |
| README | https://github.com/a-b-street/osm2streets/blob/main/README.md |
| CHANGES | https://github.com/a-b-street/osm2streets/blob/main/CHANGES.md |
| CONTRIBUTING | https://github.com/a-b-street/osm2streets/blob/main/CONTRIBUTING.md |
| How it works | https://github.com/a-b-street/osm2streets/blob/main/docs/how_it_works.md |
| Architecture diagram | https://github.com/a-b-street/osm2streets/blob/main/docs/architecture.svg |
| Transformations | https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/transform/mod.rs |
| Lane algorithm | https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/algorithm.rs |
| osm2lanes-js | https://github.com/a-b-street/osm2streets/tree/main/osm2lanes-js |
| osm2streets-js | https://github.com/a-b-street/osm2streets/tree/main/osm2streets-js |
| osm2streets-py | https://github.com/a-b-street/osm2streets/tree/main/osm2streets-py |
| osm2streets-java | https://github.com/a-b-street/osm2streets/tree/main/osm2streets-java |
| Regression tests | https://github.com/a-b-street/osm2streets/tree/main/tests |
| StreetExplorer | https://a-b-street.github.io/osm2streets/ |
| Lane editor demo | https://a-b-street.github.io/osm2streets/lane_editor.html |
| Intersection geometry article | https://a-b-street.github.io/docs/tech/map/geometry/index.html |
| FOSSGIS talk | https://dabreegster.github.io/talks/map_model_v2/slides.html |
| SOTM 2022 talk | https://dabreegster.github.io/talks/sotm_2022/slides.html |
