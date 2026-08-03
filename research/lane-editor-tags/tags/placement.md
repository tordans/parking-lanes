# Placement (`placement=*`)

## What it means

`placement=*` specifies where the **OSM way geometry** sits relative to the **physical road cross-section** ([Key:placement](https://wiki.openstreetmap.org/wiki/Key:placement), [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement)).

Consumers assume the way runs down the **centre of the road** unless told otherwise. When lane counts are asymmetric (turn lane, motorway exit, centre bike lane offset), that assumption breaks — lanes render in the wrong position.

**Classification:** Geometry (way-level, not `:lanes` pipes).

Critical for **Straßenraumkarte** ([micromap blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)): `placement=right_of:1` + `width:lanes` places car and bike lanes relative to the drawn line.

## Values

| Value | Meaning |
|-------|---------|
| *(absent)* | Way assumed at horizontal centre of all lanes |
| `placement=middle_of:N` | Way aligned with centre of lane N (1 = leftmost in view direction) |
| `placement=right_of:N` | Way runs along right edge of lane N |
| `placement=left_of:N` | Way runs along left edge of lane N |
| `placement=transition` | Way not parallel to full road width — lane count or offset changes along segment |
| `placement:start`, `placement:end` | Placement at segment ends when gradual change |
| `placement:forward`, `placement:backward` | Direction-specific on two-way roads |

Lane numbering: view road in tagged direction; lanes numbered **left to right**, 1-based ([placement proposal](https://wiki.openstreetmap.org/wiki/Proposed_features/placement)).

### Examples

**Motorway deceleration lane** — way in middle of through lane 2:

```
placement=middle_of:2
```

**Straight OSM way, exit to the right** — way along right edge of lane 1:

```
placement=right_of:1
```

**Lane merge 3→2** — short segment:

```
placement=transition
width:lanes:end=||0
```

Or `lanes=3` on approach, `lanes=2` after split, with transition segment ([placement proposal](https://wiki.openstreetmap.org/wiki/Proposed_features/placement)).

## Transition, start, end

Use `placement=transition` when:

- Road forks or joins.
- Lane count changes and way cannot stay centred.
- Deceleration/acceleration lane geometry matters for navigation/rendering.

`:start` / `:end` suffixes when placement shifts gradually between known endpoints; often redundant if adjacent ways define endpoints ([placement proposal](https://wiki.openstreetmap.org/wiki/Proposed_features/placement)).

Pair with:

- `width:lanes:start` / `width:lanes:end` for tapering lane widths.
- Way splits at lane count changes per [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes).

## Straßenraumkarte usage

From [blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update):

1. `lanes=2` + `width:lanes:forward/backward` → car lane widths.
2. `bicycle:lanes` adds extra slots.
3. `placement=right_of:1` → OSM line is right of leftmost lane; all lanes drawn to the right.
4. Stop lines at signals sized from lane count, width, placement, and `area:highway` junction outline.

OsmLaneVisualizer: experimental support for `placement` and transition detail ([README](https://github.com/mueschel/OsmLaneVisualizer)).

## Effects on rendering / editing

| Consumer | Placement |
|----------|-------------|
| Straßenraumkarte | Required for precise cross-section |
| JOSM Lane and Road Attributes | Visualizes placement |
| osm2streets | Shifts `reference_line` → `center_line` via `Placement::parse` / `left_edge_offset_of`; `transition` and varying start/end still incomplete (see [osm2streets.md § Lane editor & lane drawing](../projects/osm2streets.md#lane-editor--lane-drawing)) |
| OSMPIE | Documents wiki `placement` / `transition` and extension `placement=dist:±N` ([public placement examples](https://github.com/kuzinmv/osmpie-doc/blob/master/en/examples/placement.md)) |
| Maperitive lane rules | Listed on Key:lanes as consumer |
| Default routers | Usually ignore — geometry for render/nav detail only |

## Ambiguities

1. **Draft status** — de facto in use but proposal still "draft".
2. **Mapping style** — multiple valid ways to draw centreline; placement documents mapper's choice ([placement proposal](https://wiki.openstreetmap.org/wiki/Proposed_features/placement)).
3. **Extreme angles** on transition segments — proposal warns avoid ~90° transition ways.
4. **`Relation:connectivity`** needed when placement + turn:lanes insufficient for lane guidance.
5. **DE:Key:placement** stub only — full text EN proposal.

## Links

| Resource | URL |
|----------|-----|
| Key:placement (EN) | https://wiki.openstreetmap.org/wiki/Key:placement |
| DE:Key:placement | https://wiki.openstreetmap.org/wiki/DE:Key:placement |
| Proposed features/placement | https://wiki.openstreetmap.org/wiki/Proposed_features/placement |
| Relation:connectivity | https://wiki.openstreetmap.org/wiki/Relation:connectivity |
| Straßenraumkarte blog | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |

## Editor requirements

**Must:**

- Offset lane geometry from way line using `placement` + `width:lanes`.
- Support `middle_of:N`, `right_of:N`, `left_of:N`, `transition`.
- `placement:forward` / `:backward` on two-way roads.
- Auto-suggest `transition` when lane count changes at way split.

**Should:**

- Preview cross-section vs way line (Straßenraumkarte-style).
- `placement:start` / `:end` with tapering `width:lanes:*`.
- Warn if placement missing when `lanes:forward` ≠ `lanes:backward` and way looks centred.

**Nice:**

- Connectivity relation integration at junctions.
- Snap helpers for motorway exit templates.
