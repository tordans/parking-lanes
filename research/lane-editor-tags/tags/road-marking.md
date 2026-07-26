# Road markings as separate geometries (`road_marking=*`)

## Status and scope

**Status: approved** ([Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking)). Approved via [Proposal:Road_marking_revision](https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision) (Supaplex030; vote ended 2025-07-10).

**Classification:** Physical / marking — but mapped on **separate geometries** (line, area, or node), not on the highway centreline.

> **Wiki lag:** Some sibling pages may still call `road_marking` experimental or list pre-revision values without deprecation notes (e.g. old value pages like `road_marking=solid_stop_line`). The canonical key page and approved proposal supersede those. [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings#See_also) still links to `road_marking` but may not reflect the 2025 approval yet.

Full research on centreline-derived markings: [markings-and-change.md](markings-and-change.md).

---

## Purpose

`road_marking=*` maps **road markings as their own OSM features** — coloured paint or permanent pavement markings that provide traffic information.

The schema is **not** for tracing every longitudinal lane line along a road. Linear markings along regular carriageways can usually be inferred from centreline tags (`lane_markings`, `lanes`, `overtaking`, `change`, `turn:lanes`, `crossing:markings`, etc.) combined with `placement` and `width:lanes`.

Use `road_marking` when markings **cannot be accurately derived** from existing centreline data, for example:

- Markings **inside junction areas** (arrows, gores, stop lines, lane dividers across intersection pavement)
- **Symbolic** markings (arrows, text, pictograms) where position and extent matter for cartography
- **Areal** restriction or crossing surfaces (chevrons, zigzags, coloured crossing pads)
- Stop lines where a **separate line geometry** is preferred over a node on the highway (see footnote on [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking))

When `area:highway=*` carriageway polygons exist, `road_marking` features are mapped **on top of** those areas (additional geometry, not a replacement).

---

## What NOT to map with `road_marking`

Do **not** duplicate centreline semantics with separate geometries when centreline tags suffice:

| Centreline tag(s) | What it already conveys | Do not re-map as |
|-------------------|-------------------------|------------------|
| `lane_markings=yes` + `lanes=N` | Presence and count of marked lanes | Long runs of `road_marking=lane_divider` along the way |
| `overtaking=no` (regional) | Solid centre line between opposing traffic | `lane_divider` / `edge_line` for the centreline |
| `change:lanes=*` | Solid vs dashed between same-direction lanes | Per-segment `lane_divider` along the way |
| `turn:lanes=*` | Indicated turn directions per lane | `road_marking=arrow` along the whole approach (unless junction detail needs explicit geometry) |
| `crossing:markings=*` on the crossing way | Crossing line type (zebra, dots, …) | `crossing_edge` / `crossing` unless detailed areal extent is needed |
| `highway=stop` / `give_way` / `traffic_signals` | Stop line presence (many countries) | `stop_line` **unless** separate line geometry or styling (`stroke=sharks_teeth`) is required |
| `parking:side=*` + `parking:*:markings` | On-street parking bay markings | Restriction areas already covered by parking tags |

**Rule of thumb:** If a lane editor or renderer can draw the marking from `*:lanes` / `lane_markings` / `change` / `overtaking` on the centreline, do not add parallel `road_marking` ways.

---

## Values

| Value | Geometry | Description | Styling subtags | Interdependence with other tags |
|-------|----------|-------------|-----------------|--------------------------------|
| `stop_line` | line, or node on highway | Stop line before signals, signs, or junctions | `stroke=*` (`solid`, `sharks_teeth`, …); on node: `direction=forward/backward` | `highway=stop`, `highway=give_way`, `highway=traffic_signals` |
| `lane_divider` | line | Lane demarcation (between lanes) | `stroke=*` (`dashed`, `double_solid`, `zigzag`, …); `stroke:left` / `stroke:right` for asymmetric doubles; `colour=*`, `width=*` | `lane_markings`, `lanes`, `change`, `overtaking` — must stay consistent |
| `edge_line` | line | Carriageway edge / boundary marking | `stroke=*` (`solid`, …); `colour=*`, `width=*` | Carriageway extent; complements `width` / shoulder tags |
| `crossing_edge` | line | Edge/border of pedestrian or cycle crossing markings | `stroke=*` (`dashed`, `solid`, …) | `crossing:markings=*` on crossing way |
| `restriction` | area | Neutral or restricted areas (gore chevrons, no-stopping zigzags, box junctions) | `pattern=*` (`chevron`, `stripes`, `zigzag`, `crosshatch`, …); `stroke=*` for area outline; `reason=*` (`bus_stop`, `driveway`, `emergency`, `junction`, …); `colour=*` | `parking:side:*`, parking restrictions; prefer over legacy `area:highway=prohibited` for new mapping |
| `crossing` | area | Detailed extent of crossing markings or coloured crossing surfaces | `pattern=*` (may reuse `crossing:markings` values but avoid duplication); `colour=*` | `crossing:markings=*`, `highway=crossing` |
| `arrow` | line | Turn or direction arrow (line from foot to tip of one arrow) | `arrow=*` (values from `turn=*`: `left`, `through`, `through;right`, `merge_to_left`, `reverse`, …; or restriction values like `no_u_turn`) | `turn:lanes=*` — arrows must match lane turn indications |
| `traffic_sign` | node (typical) | Road-surface equivalent of a traffic sign | `traffic_sign=*`; `colour=*`, `length=*` on node | `maxspeed=*`, `hazard=*`, sign-related tags |
| `text` | node (typical) | Surface lettering ("BUS", "SLOW", street names) | `inscription=*`; `colour=*`, `length=*` | `lanes:bus`, `bus:lanes`, `access:lanes`, `hazard=*` |
| `symbol` | node (typical) | Surface pictogram (bicycle, pedestrian, HOV, airport, …) | `symbol=*` (`bicycle`, `pedestrian`, `hov`, `airport`, …); `colour=*`, `length=*` | `cycleway=*`, `destination:symbol=*`, etc. |

Sources: [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking), [Proposal:Road_marking_revision](https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision).

---

## Styling and physical attributes

Subtags describe **design** separately from **function** (`road_marking=*` value).

| Tag | Applies to | Role |
|-----|------------|------|
| `stroke=*` | lines; area outlines | Line style: `solid`, `dashed`, `double_solid`, `sharks_teeth`, `zigzag`, … |
| `stroke:left` / `stroke:right` | lines | Asymmetric double lines (relative to way direction) |
| `pattern=*` | areas | Fill pattern: `chevron`, `stripes`, `zigzag`, `crosshatch`, `solid`, … |
| `arrow=*` | `road_marking=arrow` | Arrow shape (values from `turn=*` or restriction tagging) |
| `symbol=*` | `road_marking=symbol` | Pictogram type |
| `colour=*` | any | `white`, `yellow`, `red`, … |
| `width=*` | lines | Narrow vs wide markings |
| `direction=*` | nodes | `forward` / `backward` — which travel direction is affected |
| `length=*` | nodes | Size of symbolic markings |
| `inscription=*` | `road_marking=text` | Literal text content |
| `reason=*` | `road_marking=restriction` | Why area is marked (`bus_stop`, `driveway`, `emergency`, `junction`, …) |
| `traffic_sign=*` | `road_marking=traffic_sign` | Which sign is painted on the surface |

Directed strokes (e.g. `sharks_teeth`) point to the **right** of the line direction ([Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking)).

---

## Relationship to centreline tagging

Centreline tags carry **meaning**; `road_marking` carries **geometry and cartographic detail**. When both exist, they must be **consistent**:

| Centreline | `road_marking` counterpart | Consistency rule |
|------------|---------------------------|------------------|
| `turn:lanes=left\|through\|right` | `arrow` features in junction | Arrow `arrow=*` values must match corresponding lane slots |
| `change:lanes=no` between lanes | `lane_divider` + `stroke=double_solid` | Solid divider where lane change is forbidden |
| `overtaking=no` | centre `lane_divider` or implied solid line | No dashed centre where overtaking is banned |
| `highway=stop` at node | `stop_line` line or node | Same location; optional `stroke` for teeth style |
| `parking:side=no_stopping` | `restriction` + `reason=*` | Restricted area aligns with parking rules |
| `area:highway=prohibited` (legacy) | `restriction` + `pattern=*` | Wiki: prefer `road_marking=restriction` for new mapping; some mappers treat as synonymous |

Do not tag contradictory information (e.g. `turn:lanes=through` on centreline but only `arrow=left` markings for that lane).

---

## “Divider” — four different concepts

Research and tools use “divider” for unrelated things. [markings-and-change.md](markings-and-change.md) covers centreline marking derivation; this note covers separate-geometry dividers.

| # | Term | What it is | Where in research |
|---|------|------------|-------------------|
| 1 | **Editor UI divider** | Visual boundary between lane slots in a lane editor (not an OSM tag) | [bjornrasmussen-josm-lanes.md](../projects/bjornrasmussen-josm-lanes.md), [id-editor-discussions.md](../projects/id-editor-discussions.md) |
| 2 | **`divider=*`** | Simple OSM key for centre-line divider type on the **highway way** ([Key:divider](https://wiki.openstreetmap.org/wiki/Key:divider)) | [markings-and-change.md](markings-and-change.md), [consolidated-tag-reference.md](consolidated-tag-reference.md) |
| 3 | **`road_marking=lane_divider`** | Separate **line geometry** for a lane marking (junction detail, micromapping) | This note |
| 4 | **Proposal:Separation / inferred separators** | `cycleway:marking=*`, `separation:lanes`, or renderer-inferred solid/dashed between lanes (`change:lanes`, regional defaults) | [separation-proposal.md](separation-proposal.md), osm2streets separator objects in [markings-and-change.md](markings-and-change.md) |

`divider=*` on the centreline and `road_marking=lane_divider` as separate geometry can coexist in principle but should not contradict `change:lanes` / `overtaking`. Prefer centreline tags for through-road segments; use `road_marking=lane_divider` where centreline inference fails (junctions, complex tapers).

---

## Relationship to Proposal:Separation `marking=*`

[Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) `marking=*` / `cycleway:marking=*` tags describe **edge marking style on the highway centreline** (or separate cycleway), e.g. `solid_line`, `dashed_line`, `double_solid_line`. Still **draft**.

| | `cycleway:marking=*` (Separation) | `road_marking=lane_divider` / `edge_line` |
|---|-----------------------------------|-------------------------------------------|
| Geometry | Tag on existing `highway=*` or `cycleway` way | Separate line feature |
| Scope | Cycle lane edges, on-way lane edges | Any marking needing explicit geometry |
| Status | Draft proposal | **Approved** |
| Cartographic concern | Same — how to draw lane/cycleway edges | Same — but for junction micromapping |

A lane editor may edit Separation `marking` in the cross-section UI and `road_marking` in a separate junction layer. See [separation-proposal.md](separation-proposal.md).

---

## Straßenraumkarte context

[Straßenraumkarte Neukölln](../projects/strassenraumkarte.md) predates the 2025 approved schema:

- The [2021 micromap blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) discusses junction rendering problems and mentions experimental approaches including early `road_marking` usage and non-standard `lane_markings:junction=yes`.
- SRK **derives** most lane lines from centreline tags (`lane_markings`, `change:lanes`, `overtaking`, `turn:lanes`) in `post_processing.py` — it does not consume `road_marking=*` as a primary input today.
- `area:highway` + `junction=yes` polygons clip derived markings; `area:highway=prohibited` marks restricted areas (overlap with `road_marking=restriction` — wiki now prefers `restriction` for new mapping).
- Stop lines are **generated** from traffic signal/stop nodes and lane widths, not read from `road_marking=stop_line` features.

Evolution: 2014-era undocumented `road_marking` values → heavy use for stop lines → **approved revision 2025** with structured values + styling subtags. Micromappers in Berlin may adopt `road_marking` for junction detail as SRK and other renderers add support.

---

## Editor implications (lane editor)

### Primary UI stays on the centreline

A lane editor’s core model remains:

- `lanes` / `*:lanes` (access, turn, bus, cycle)
- `lane_markings`, `change:lanes`, `overtaking`
- `turn:lanes`, `placement`, `width:lanes`

These drive lane count, arrows in preview, and inter-lane solid/dashed lines (osm2streets-style).

### `road_marking` as a separate layer

| Priority | Rationale |
|----------|-----------|
| **Should** (junction / micromap editor mode) | Complex intersections, gores, explicit arrows, stop-line geometry — aligns with Straßenraumkarte-style cartography and approved OSM practice |
| **Nice** (v1 pure centreline lane editor) | Not required for basic lane tagging; add when preview targets junction fidelity or importing existing `road_marking` data |

v1 recommendation: **read-only display** of nearby `road_marking` features in junction preview; **full editing** deferred unless the product targets micromapping. If supported later: dedicated geometry tools (line / area / point), value picker, styling subtags, snap to `area:highway` and centreline.

### Consistency checks when both exist

- `turn:lanes` pipe count vs `arrow` features at approach
- `change:lanes` solid segments vs `lane_divider` + `stroke`
- `highway=stop` node vs `stop_line` position
- `area:highway=prohibited` vs `restriction` — warn on duplicate/conflicting restricted areas
- Flag legacy values (`solid_stop_line`, bare `left`/`right`/`through`) for migration

---

## Legacy and “possible tagging mistakes”

Pre-revision unstructured values should be reclassified ([Key:road_marking#Possible_tagging_mistakes](https://wiki.openstreetmap.org/wiki/Key:road_marking#Possible_tagging_mistakes)):

| Legacy value | Replace with |
|--------------|--------------|
| `solid_stop_line` | `road_marking=stop_line` + `stroke=solid` |
| `left`, `right`, `through` | `road_marking=arrow` + `arrow=left` / `right` / `through` |
| `solid_lane_divider` | `road_marking=lane_divider` + `stroke=solid` |
| `dash` | `road_marking=lane_divider` + `stroke=dashed` |
| `gore_chevron` | `road_marking=restriction` + `pattern=chevron` |
| `solid_crossing_edge` | `road_marking=crossing_edge` + `stroke=solid` |
| `solid_road_edge` | `road_marking=edge_line` + `stroke=solid` |

Old value wiki pages may lack deprecation banners — treat the key page and proposal as authoritative.

---

## Source index

| Resource | URL |
|----------|-----|
| Key:road_marking (approved) | https://wiki.openstreetmap.org/wiki/Key:road_marking |
| Proposal:Road_marking_revision | https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision |
| Key:lane_markings (See also — may lag) | https://wiki.openstreetmap.org/wiki/Key:lane_markings |
| Key:divider | https://wiki.openstreetmap.org/wiki/Key:divider |
| Proposal:Separation | https://wiki.openstreetmap.org/wiki/Proposal:Separation |
| Straßenraumkarte micromap blog (2014-era road_marking mention) | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |
| Centreline markings research | [markings-and-change.md](markings-and-change.md) |
| Straßenraumkarte project notes | [strassenraumkarte.md](../projects/strassenraumkarte.md) |

## Editor requirements summary

**Must (centreline lane editor):** No `road_marking` editing required for MVP.

**Should (junction / micromap mode):** Read `road_marking` near edited ways; consistency warnings vs `turn:lanes`, `change:lanes`, stop nodes; migrate/display legacy values.

**Nice (v1+):** Draw/edit `stop_line`, `arrow`, `restriction`, `lane_divider` in junction view; styling subtag pickers; snap to carriageway areas.
