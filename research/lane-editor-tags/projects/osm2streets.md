# osm2streets (active)

**See also:** [muv-osm.md](./muv-osm.md) — external `muv-osm` crate that performs per-way lane parsing (since [PR #233](https://github.com/a-b-street/osm2streets/pull/233)); osm2streets `osm2lanes/src/algorithm.rs` is the translation layer.

Research snapshot for [a-b-street/osm2streets](https://github.com/a-b-street/osm2streets). Sources: README, `CHANGES.md`, `CONTRIBUTING.md`, `docs/how_it_works.md`, `osm2lanes/src/algorithm.rs`, `osm2streets/src/transform/mod.rs`, `tests/README.md`, plus primary lane-editor / render source cited below.

**Fetch date (lane editor & drawing):** 2026-08-03 (`main` branch).

## Overview and features

`osm2streets` transforms OSM into a **simplified street network** suited to lane-level rendering, routing, and analysis — especially where OSM splits carriageways, cycletracks, and footways across parallel ways or complex intersections.

### Schema (current)

| Entity | Properties |
|--------|------------|
| **Road** | Segment between exactly two intersections; thickened linestring; **lanes left-to-right** (type, direction, width) |
| **Intersection** | Polygon linking roads at perpendicular angles; kinds include real intersections, map edges, termini, forks, connections |

**Planned** (README): turning movements, crosswalks, bike boxes, pedestrian islands, modal filters, lane width changes.

### Rendering (summary)

The library emits **map-space GeoJSON** for a full `StreetNetwork`, not a schematic cross-section panel:

| Output | API | Source |
|--------|-----|--------|
| Road + intersection fill polygons | `to_geojson` / `toGeojsonPlain` | [`render/mod.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/mod.rs) — road = `center_line.make_polygons(total_width())` |
| One polygon per lane | `to_lane_polygons_geojson` / `toLanePolygonsGeojson` | same file — lane centreline × `lane.width` |
| Painted markings (web UI path) | `to_lane_markings_geojson` / `toLaneMarkingsGeojson` | [`lane_markings.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/lane_markings.rs) |
| Newer semantic markings + paint | `calculate_markings` / `calculate_paint_areas` | [`output.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/output.rs) + [`paint.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/paint.rs) — **not** wired through `osm2streets-js` / lane editor as of 2026-08-03 |

Lane editor drawing mechanics: see **[Lane editor & lane drawing](#lane-editor--lane-drawing)** below.

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
| [Lane editor](https://a-b-street.github.io/osm2streets/lane_editor.html) | Edit OSM tags → visual lane result on the **map** (GeoJSON polygons) |
| **Planned** | iD and JOSM plugins for detailed street display/edit |

## Lane editor & lane drawing

**Live demo:** [lane_editor.html](https://a-b-street.github.io/osm2streets/lane_editor.html#1/0/0)  
**Web app:** Svelte + MapLibre + `osm2streets-js` WASM ([`web/README.md`](https://github.com/a-b-street/osm2streets/blob/main/web/README.md), [`web/src/lane-editor/`](https://github.com/a-b-street/osm2streets/tree/main/web/src/lane-editor))  
**Investigated:** 2026-08-03 against `main`.

### What the UI actually shows

The lane editor is **not** a Streetmix-style schematic cross-section. It is a **map view** of the full imported `StreetNetwork`:

| Layer (Svelte) | WASM call | Geometry |
|----------------|-----------|----------|
| [`RenderLanePolygons.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/common/layers/RenderLanePolygons.svelte) | `toLanePolygonsGeojson()` | One filled polygon per lane |
| [`RenderLaneMarkings.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/common/layers/RenderLaneMarkings.svelte) | `toLaneMarkingsGeojson()` | Separators, arrows, parking hatches, sidewalk ticks, … |
| Intersection polygon / marking layers | matching `toIntersection*` APIs | Junction fills + markings |
| Selection highlight | `getGeometryForWay(wayId)` | Wide buffer around the way’s **original** OSM polyline + direction chevrons |

Edit UX ([`App.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/lane-editor/App.svelte), [`Tags.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/lane-editor/Tags.svelte)):

1. Click a lane polygon → resolve `osm_way_ids` (alert if ≠ 1 way after transforms).
2. Sidebar lists that way’s OSM tags (key/value rows).
3. **Recalculate** → `overwriteOsmTagsForWay` → MapLibre layers re-read GeoJSON from the mutated network.
4. Export edited ways as `.osc` (change file) via [`AllEdits.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/lane-editor/AllEdits.svelte).

There is **no** drag-to-reorder lane strip in this app. Tag text → re-parse → redraw. Warnings in the UI explicitly caution about sidepaths, dual carriageways, and clipped ways.

### Edit → draw pipeline (runtime)

```text
OSM XML (Overpass / fixture)
        │
        ▼
JsStreetNetwork::new  ──► streets_reader::osm_to_street_network
        │                   (split ways, clip, fill lane_specs_ltr via get_lane_specs_ltr / muv)
        │
        ▼
apply_transformations(standard_for_clipped_areas [+ optional experiments])
        │
        ▼
update geometry (trim centres to intersection polygons)
        │
        ▼
MapLibre fills from toLanePolygonsGeojson / toLaneMarkingsGeojson
        │
user edits tags ──► overwriteOsmTagsForWay(way, tags)
        │              • get_lane_specs_ltr again on affected Road(s)
        │              • Placement::parse → reference_line_placement
        │              • update_center_line(driving_side)
        │              • update_i on endpoint intersections
        ▼
same GeoJSON render path (no full re-import)
```

Source: [`osm2streets-js/src/lib.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets-js/src/lib.rs) (`overwrite_osm_tags_for_way`, import options).

### Default transforms in the lane editor

Import settings ([`Osm2streetsSettings.svelte`](https://github.com/a-b-street/osm2streets/blob/main/web/src/common/import/Osm2streetsSettings.svelte)) default to:

| Option | Default | Effect on drawing |
|--------|---------|-------------------|
| Dual carriageway experiment | **off** | No `MergeDualCarriageways` |
| Sidepath zipping experiment | **off** | No `ZipSidepaths` |
| Infer sidewalks on roads | **off** (`inferred_sidewalks: false`) | Uses mapped footways / tagged sidewalks only |
| Infer kerbs | **on** | Curb `Buffer` lanes from muv kerb indices |

So a typical lane-editor session draws **close-to-OSM** roads (plus `standard_for_clipped_areas` collapses), not the experimental dual/sidepath merges — those are opt-in checkboxes.

### How LTR specs become map polygons

Core data on each `Road` ([`road.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/road.rs)):

| Field | Role |
|-------|------|
| `reference_line` | Original (smoothed) OSM centreline; may sit anywhere in the stack per placement |
| `reference_line_placement` | Parsed `placement*` (`Consistent` / `Varying` / `Transition`) |
| `center_line` | Physical centre of the **full** lane stack (`RoadPosition::FullWidthCenter`), after placement shift + later trim |
| `lane_specs_ltr` | Ordered lanes: type, direction, width (metres) |
| `trim_start` / `trim_end` | How much to shorten/extend at each intersection |

**Step A — place the road centre relative to the OSM way**

`get_untrimmed_center_line`:

1. Resolve placement → a `RoadPosition` (default `Center` = midpoint of the *roadway* bands, excluding outer sidewalks/buffers; `FullWidthCenter` = half of `total_width()`).
2. `left_edge_offset_of(position)` = metres from the left edge of the LTR stack to that anchor.
3. Shift `reference_line` by `(FullWidthCenter offset − placement offset)` so the drawn stack sits correctly around the tagged OSM line.

Limitations encoded in the same function: **`placement=transition` falls back to `Center`**; **`Varying(start,end)` uses only the start** (“varying placement not yet supported”).

**Step B — one centreline per lane**

`get_lane_center_lines`:

```text
total_width = Σ lane.width
width_so_far = 0
for each lane in lane_specs_ltr:
  width_so_far += lane.width / 2
  lane_centre = center_line.shift_from_center(total_width, width_so_far)
  width_so_far += lane.width / 2
```

So each lane is a parallel offset of the road `center_line`, not an independent buffer of the OSM way.

**Step C — thicken to polygons**

[`to_lane_polygons_geojson`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/mod.rs): for each `(lane, lane_centre)`, emit `lane_centre.make_polygons(lane.width)` as GeoJSON (GPS via `gps_bounds`). Road-level fill uses `center_line.make_polygons(total_width())`.

**Step D — intersection trim**

After import (and after tag overwrite via `update_i`), road centres are trimmed so thickened roads meet intersection polygons at (approximately) right angles. Algorithm overview: [A/B Street geometry deep dive](https://a-b-street.github.io/docs/tech/map/geometry/index.html) (article marked outdated in `docs/how_it_works.md`, but still the conceptual reference); implementation under [`osm2streets/src/geometry/`](https://github.com/a-b-street/osm2streets/tree/main/osm2streets/src/geometry) + [`operations/update_geometry.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/operations/update_geometry.rs).

### How markings are drawn

[`lane_markings.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2streets/src/render/lane_markings.rs) walks adjacent LTR pairs and each lane’s centreline (reversed when `Direction::Backward` for travel-oriented glyphs):

| Marking | Rule (simplified) |
|---------|-------------------|
| Centre line | Between opposite-direction neighbours → dashed polygons on the shared edge |
| Lane separator | Between two `Driving` lanes same direction → different dash pattern |
| Lane arrows | Travel lanes only; stepped along centre (~20 m), triangle arrow outlines |
| Stop lines | From `road.stop_line_start/end` distances when tagged/set |
| Buffer stripes | Non-curb `Buffer_*` → edge lines + diagonal hatch |
| Parking hatch | Parallel / diagonal / perpendicular spot ticks from config lengths |
| Sidewalk lines | Perpendicular ticks along sidewalk centres |
| Path outlines | Dashed edges for `SharedUse` / `Footway` |

This is the path the **web UI** uses. A newer `calculate_markings` / `paint` stack exists in-tree but is **not** exposed on `JsStreetNetwork` yet.

### Placement tags (drawing-relevant)

Parsed in [`osm2lanes/src/placement.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/placement.rs) (`placement`, `placement:forward/backward`, `*:start`/`*:end`, `left_of:` / `middle_of:` / `right_of:` / `separation`). Drawing consumes the result only as a lateral shift of `reference_line` → `center_line` (see Step A). Fixture: `tests/src/fremantle_placement/`.

### Comparison to our road-space sketch

| Concern | osm2streets lane editor | Our panel (`docs/lanes-road-space-approach.md`) |
|---------|-------------------------|--------------------------------------------------|
| Canvas | Geographic MapLibre polygons | Abstract SVG corridor in a panel |
| Scope | Whole clipped network | Selected way (+ optional prev/next stubs) |
| Edit surface | Raw OSM tag rows → recalculate | Matrix form; sketch is read-only |
| Parse | muv via `get_lane_specs_ltr` at runtime | TS `@osm-editor-kit/osm-lanes` (+ muv parity tests) |
| Sidewalks | Optional inference; can zip sidepaths | Never invent; `*=separate` = text hint only |
| Dual carriageways | Optional merge experiment | Local spread, no graph merge |
| Placement | Shifts geo centreline; transition/varying incomplete | Drives schematic offsets; transition still limited |
| Parking | Drawn as lane polygons + hatches | Not in lane diagram (own mode) |

**Takeaways for us:** steal the **LTR width accumulation + placement offset** mental model and marking taxonomy; do **not** adopt the WASM `StreetNetwork` lifecycle or map-space thickening for the edit panel. Their editor confirms the product split we already chose: map-faithful network render ≠ tag-editing sketch.

### Still thin / unverified

- Exact `PolyLine::shift_from_center` / `make_polygons` math lives in the external `geom` crate (A/B Street), not re-derived here.
- Whether every post-edit `update_i` fully re-runs intersection polygon logic vs partial refresh — read as “updates endpoints”; edge cases around multi-way roads after collapse not exercised in this pass.
- `output.rs` / `paint.rs` semantic marking model: present in Rust, unused by the published lane editor.

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
| Lane editor demo | https://a-b-street.github.io/osm2streets/lane_editor.html#1/0/0 |
| Intersection geometry article | https://a-b-street.github.io/docs/tech/map/geometry/index.html |
| FOSSGIS talk | https://dabreegster.github.io/talks/map_model_v2/slides.html |
| SOTM 2022 talk | https://dabreegster.github.io/talks/sotm_2022/slides.html |
