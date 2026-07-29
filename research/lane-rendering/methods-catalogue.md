# Lane rendering — methods catalogue

Implementer-oriented extraction from [00-research-question.md](./00-research-question.md). Prefer primary sources cited there when behaviour is ambiguous.

**Scope for now:** short segments; centreline + lane tags as primary input; optional context tags/geometries when available.

---

## 1. Pipeline stages (shared)

| Stage | Input | Output | Used by |
|-------|--------|--------|---------|
| **Parse LTR stack** | Way tags (`lanes*`, access pipes, cycleway, parking, buffers) | Ordered lanes: type, direction, width, marking hints | SRK, osm2streets/muv-osm, Map Machine (partial) |
| **Resolve placement** | `placement*` (+ start/end), oneway, lane count | Absolute index / metre offset of centreline in stack | SRK, Map Machine, Imagico (gap), osm2lanes placement |
| **Metric thicken / offset** | Centreline polyline + widths + placement | Parallel lines or road polygon + lane divider lines | All lineages |
| **Transition handling** | Neighbours or mid-block width change | Continuous offsets or degenerate 2-road junction | SRK `placement=transition`; A/B Street degenerate intersection |
| **Junction / island policy** | Topology + optional areas/tags | Cut-out, spread, or consolidated polygon | See §3 |
| **Style draw** | Derived features | Fills, dashes/solids, arrows, BUS/bike emblems, stop lines, crossings | QGIS (SRK), MapLibre/SVG (editors), Cairo (Map Machine) |

Regional defaults matter: SRK uses ~3.0 m car / 1.5 m cycle / 2.2 m parking (Berlin); Map Machine uses 3.7 m per lane.

---

## 2. Cross-section offset (core algorithm)

### 2.1 Absolute left→right indexing

1. Build full left→right lane list (merge `*:backward` reversed + `*:forward` when tagged directionally).
2. Expand stack for on-carriageway cycle lanes (`cycleway:left/right/both=lane` or `cycleway:lanes` entries) — **do not** assume they are already in `lanes=` (SRK practice).
3. Resolve `placement` → `placement_abs` (direction-independent index: `left_of:N`, `right_of:N`, `middle_of:N`).
4. Defaults if missing (SRK): odd `lanes` → `middle_of:(lanes/2)`; even → `left_of:(lanes/2+1)`.

### 2.2 Offset computation (SRK-shaped)

1. Sum widths from placement anchor to each lane edge / centre.
2. Generate parallel geometries (`offsetline` / `arrayoffsetlines` or equivalent).
3. Apply per-instance `offset_delta` for variable `width:lanes`, cycle buffers, parking-related `extra_offset`.
4. Emit **one feature per lane** (or per separator) with derived attrs: `access`, `turn`, `marking:left/right`, `width`, `surface:colour`, …

### 2.3 Simpler variant (Map Machine / Imagico)

1. Total width = `width` OR `lanes × default_lane_width` OR highway-class default.
2. Optional placement shifts the drawn centreline.
3. Draw `lanes−1` evenly spaced separators inside the fill (not access-coloured slots).
4. **Limitation:** Imagico notes this breaks when lane count/width changes without `placement` interpretation.

### 2.4 Projection / CRS

- Do offsets in a **metric CRS** (SRK: EPSG:25833 for Berlin).
- Web Mercator tile export needs latitude scale correction (Berlin ≈ 1.62 per SRK README).

---

## 3. Splits, merges, islands, junctions

### 3.1 Mid-block lane count / width change

| Approach | Mechanism | When to use |
|----------|-----------|-------------|
| **Transition tags** | `placement=transition` + `placement:start`/`end` (+ optional width start/end); link neighbour segments (same name/highway, shallow angle) | Short-segment editor with adjacent ways available |
| **Degenerate intersection** | Split way where width/lane stack changes; treat join as 2-road “intersection” and trim | Network model that already polygonizes intersections (A/B Street) |
| **Ignore / kink** | Equal-space separators on each segment independently | Prototype only; looks wrong at islands and pocket lanes |

### 3.2 Traffic island / dual carriageway split (“Mittelinsel”)

**Problem:** OSM splits one logical carriageway into two one-ways around an island; naive offsets kink toward the centreline nodes.

| Approach | Mechanism | Trade-off |
|----------|-----------|-----------|
| **SRK spreading** | Tag `dual_carriageway=yes` on split parts; at join to non-dual same-name segment, **spread vertices** so markings run straight past island | Needs micromapping tag; local fix; preserves OSM topology |
| **A/B Street consolidation** | Treat short dual-cw fragments as interior; merge to one logical intersection / road | Better network polygons; rewrites graph; heuristics fragile without `junction=intersection` |
| **Explicit areas** | Map island as area (`traffic_calming=island`, `area:highway=…`) and cut/clip markings | Good visual hole; does not alone fix centreline kinks |

**Recommendation for short segments:** implement SRK spreading when `dual_carriageway` (or equivalent) + neighbour exists; otherwise show a soft warning and draw per-segment offsets.

### 3.3 Complex junctions

| Approach | Mechanism | Trade-off |
|----------|-----------|-----------|
| **Cut-out** | Don’t draw lane markings inside `area:highway` + `junction=yes` (override with `lane_markings:junction=yes`) | Clean map; no turn-lane continuity through junction |
| **Thicken–trim–polygon** | Collision of thickened sides → trim roads → clockwise intersection polygon; assume perpendicular meet | Continuous paved area; hard cases (gores, slip lanes, islands) |
| **Separate marking geometries** | Approved `road_marking=*` for arrows/stop lines/gores not derivable from centreline | Extra mapping; renderer must consume new key |

**Stop lines (SRK):** length from lane widths + placement; follow `area:highway` outline when present, else perpendicular at `highway=traffic_signals` / `stop` node; clip at kerb.

---

## 4. Bike, sidewalk, crossings

### 4.1 Bike

| Mapping style | Render approach |
|---------------|-----------------|
| On-carriageway `cycleway:*=lane` / `cycleway:lanes` | Expand LTR stack; width/default 1.5 m; separation → solid/dashed/bollard; buffer → extra offset; `surface:colour` |
| Separate `highway=cycleway` | Parallel layer (or osm2streets `ZipSidepaths` to snap to main road) |
| Mid-road exclusive lane | Explicit `width:lanes` + `placement` required for correct position |

Bus/PSV lanes usually **count in `lanes=`**; side cycle lanes usually **do not** (SRK) — UI and parsers must not conflate these.

### 4.2 Sidewalks

| Approach | Mechanism |
|----------|-----------|
| Tag-only (`sidewalk=both` etc.) | Offset strips beside carriageway (Imagico AC-style at z18+; osm2streets sidewalk lane types / inference) |
| Separate footway geometries | Draw as mapped; optional Sidewalkreator-style generation from axis for missing data |
| Inference | osm2streets `infer_sidewalk_tags` when configured — document as derived, not OSM truth |

### 4.3 Crossings

| Approach | Mechanism |
|----------|-----------|
| SRK detail | Zebra / buffer marking / signal from crossing tags; extend and clip to `barrier=kerb`; tactile paving via buffer around kerb node |
| Favreau & Kalsron (2022) | Segment intersection **area** using crossings and signals as branch boundaries — use to decide where carriageway lanes end and crossing symbols begin |
| Node-only crossing on highway | Still renderable (SRK); lower fidelity than separate crossing way |

---

## 5. Abstraction levels (pick deliberately)

| Level | Look | Example | Cost |
|-------|------|---------|------|
| **A. Width casement** | Road drawn in ground metres; optional equal lane ticks | Imagico / Map Machine | Low |
| **B. Semantic lane stack** | Coloured/access slots, turn arrows, bike separation | SRK micromap, osm2streets lane polygons | Medium–high tagging + preprocess |
| **C. Architecture plan** | Kerbs, furniture, little generalization | Seidel KN street-space map | High micromapping; locality-bound |
| **D. HD lane graph** | Survey-grade lane strings for AV | Zheng et al. survey lineage | Not the goal for abstract maps |

For an editor **preview of short segments**, **B** is the target; **A** is a useful fallback when tags are incomplete; **C** needs extra layers (kerbs, areas).

---

## 6. Minimal viable short-segment renderer

Ordered build order:

1. Parse LTR stack + defaults (car width, cycle width).
2. Placement (incl. default) → offsets → carriageway fill + separators.
3. Style markings from `lane_markings` / `overtaking` / `change` / `turn:lanes` (arrows as symbols along lane centre).
4. Add on-carriageway bike from `cycleway:*` / `cycleway:lanes`.
5. `placement=transition` if before/after segment provided.
6. Dual-carriageway spreading if tagged neighbours exist.
7. Junction cut-out if `area:highway` available; else butt-end lanes at segment end or simple perpendicular stop line at signals.
8. Optional: sidewalk offsets; crossing glyphs from nodes/ways.

**Explicit non-goals for v1:** full turn connectivity through junctions; automatic dual-carriageway merge; city-wide QGIS preprocess parity.

---

## 7. Web rendering for a React panel (not map)

**Product constraint:** show lanes in a **React panel** (edit + QA). Map overlay is out of scope for this chapter. The shipped UI is a three-column editor: map | SVG plan sketch (`RoadSpaceDiagram` via `@osm-editor-kit/osm-lane-diagram`, gallery at `/audit-lanes`) | all-lanes matrix form — not the older HTML chip strip (`LaneCrossSection` / `LaneSlotChip`, removed).

Split three jobs that people often conflate:

| Job | Question | Speed-critical? |
|-----|----------|-----------------|
| **Parse** | Tags → LTR lane stack | Only if many ways / live typing |
| **Present (schematic)** | Stack → clickable cross-section UI | No (DOM is fine) |
| **Present (plan sketch)** | Stack + short geometry → top-down abstract road | Mild (one segment) |

### 7.1 Presentation options

| Option | Fit for panel editor | Pros | Cons | Precedent |
|--------|----------------------|------|------|-----------|
| **HTML + CSS (React)** | **Best for schematic cross-section** | Native click/focus, selection, a11y, Tailwind, easy add/remove lane controls | Weak for curved plan geometry, miters, true metre scaling across a bent centreline | OsmLaneVisualizer (`div.lane` + SCSS); older chip strip in this app (removed) |
| **SVG (React or builder)** | **Best for short-segment plan sketch** | Crisp at any DPI; hit-testing per `<path>`/`<g>`; exportable; declarative | More code for text/layout; overkill for a pure chip strip | Map Machine (static SVG maps); Streetmix-like cross-sections often SVG |
| **Canvas 2D** | Weak for editor UI | Fast for many pixels | Poor hit-testing/a11y; you reimplement selection; hard to style with design system | Game-like viz; not OsmLaneVisualizer |
| **WebGL** | Not for panel | Map/GPU scale | Wrong tool for N≈10 lanes | MapLibre (map only) |
| **Pre-rendered PNG** | Bad for editor | Simple to display | Not interactive; regenerate on every tag tweak; blurry on retina | Server tile pipelines / Map Machine PNG |
| **QGIS / server raster** | Ops/export only | Matches SRK fidelity | Latency, infra, no live edit loop | Straßenraumkarte |

**Interpretation:** For “pick a lane and edit tags,” **HTML wins**. For “does this short segment look like a road with bike lanes beside cars in plan view,” **SVG wins**. Canvas/PNG are the wrong default for an interactive React panel.

### 7.2 Two panel views (recommended product split)

Keep both; they answer different questions:

1. **Schematic cross-section (HTML)** — LTR chips proportional to width (optional), turn glyphs, bike/bus colour, selection, +/- lanes. Closest UX: OsmLaneVisualizer + Streetmix. *(Superseded in this app by the matrix form + SVG plan sketch — see `packages/osm-lane-diagram`, `RoadSpaceDiagram`, `/audit-lanes`.)*
2. **Short-segment plan sketch (SVG)** — top-down abstract carriageway for the selected way (and maybe prev/next stubs): fills, separators, placement offset, optional sidewalk strips, crossing glyph at ends. **Not** full junction consolidation. Closest UX: Map Machine / Imagico / osm2streets lane polygons, but clipped to one segment in a panel `viewBox`. **This is what `@osm-editor-kit/osm-lane-diagram` implements.**

Do **not** force one renderer to do both jobs.

### 7.3 muv / osm2streets: use what, skip what?

| Piece | Use in this app? | Why |
|-------|------------------|-----|
| **muv-osm `lanes()` / osm2streets `get_lane_specs_ltr`** | **Yes — as parse gold standard** (compare or call) | Active shared semantics; StreetExplorer parity; already recommended in [muv-osm.md](../lane-editor-tags/projects/muv-osm.md) |
| **osm2streets-js full network + GeoJSON map render** | **No for panel v1** | Built for map/network transforms (zip sidepaths, collapse dual cw, intersection polygons). Heavy WASM, graph model, and UX assumptions don’t match “edit this OSM way’s tags in a React panel.” |
| **osm2streets `lane_markings.rs` drawing** | **Steal ideas, don’t embed** | Marking style logic is useful; wiring it means adopting their `StreetNetwork` lifecycle |
| **osm2lanes-js `getLaneSpecs` only** | **Optional bridge** | Smallest WASM surface if TS `@osm-editor-kit/osm-lanes` drifts from muv |

**Recommendation:** keep **parsing in the TypeScript package** (`@osm-editor-kit/osm-lanes`) as the editor’s source of truth for round-trip tagging; add **fixture/parity tests against muv** (or a thin WASM `getLaneSpecs` in CI / optional “compare with muv” mode). Do **not** drive the React panel off osm2streets GeoJSON rendering.

When would you adopt osm2streets-js in the panel anyway?

- You want their **map** lane polygons later, or
- You need network transforms (dual-carriageway merge) visible in-panel — still better as a **secondary** debug view, not the edit surface.

### 7.4 TypeScript vs Rust/WASM

| Approach | When it pays off | Cost |
|----------|------------------|------|
| **TypeScript parse + TS/React draw** | Default: one segment, interactive edit, team already on Bun/Vite/React | Must maintain parity with muv via tests |
| **Rust/WASM parse (muv or osm2lanes-js), TS draw** | Parser fidelity is hard and divergence hurts; or one shared binary for other FMC apps | Build pipeline, wasm size, async init, harder debug of tag edge cases in the UI thread |
| **Rust/WASM full geometry + draw** | City-scale offset/junction work in-browser | Overkill for panel; map-shaped architecture |

**Performance reality:** For one way (~5–15 lanes), parse + SVG/HTML layout is **milliseconds** in JS. WASM does not buy user-visible speed here. WASM buys **algorithmic fidelity and shared Rust code**, not frame rate.

**Recommendation for this app:**

1. **Stay TypeScript** for panel rendering (HTML schematic + SVG plan sketch).
2. **Stay TypeScript** for the interactive parse→tags loop unless/until muv parity tests force a WASM parser.
3. Revisit **wasm-bindgen muv / osm2lanes-js** only if (a) maintaining TS lane rules becomes the bottleneck, or (b) multiple products must share one parser binary — then WASM for **parse only**, still draw in React.

### 7.5 Suggested architecture

```text
OSM tags (selected way [+ neighbours])
        │
        ▼
@osm-editor-kit/osm-lanes  (TS) ──parity──► muv fixtures / optional WASM
        │
        ├──► LanesFormPanel (matrix + flyouts)  ← primary edit UI
        │
        └──► RoadSpaceDiagram / osm-lane-diagram (SVG)  ← plan sketch (+ /audit-lanes)
                 • widths → rects / parallel paths
                 • placement → shift stack
                 • separators / bike colour / sidewalk strips
                 • optional transition lerp if prev/next provided
```

Implementation notes:

- Build SVG from a pure function `stack + options → scene model → SVG elements` (or `d3`-free path builders). Keep the scene model JSON-serializable for tests/screenshots.
- Prefer **React-created SVG** (`<svg><g>…`) over `innerHTML` string builders so lane groups stay components with `onClick`.
- Scale with a fixed metres→pixels factor and a `viewBox`; don’t rasterize.
- For transitions (prev/next), draw two stacks or a trapezoid blend in SVG — still one segment’s worth of work.
- Export (“copy PNG”) can be a **one-off** `SVG → canvas → toBlob` from the plan sketch; not the live edit path.

### 7.6 Decision summary

| Decision | Choice |
|----------|--------|
| Schematic editor strip | **HTML/CSS React** (keep evolving current panel) |
| Realistic-but-abstract short road in panel | **SVG scene** in React |
| Canvas / live PNG | **No** for editing |
| osm2streets map renderer in panel | **No** for v1 |
| muv / osm2streets | **Parse gold standard + tests**; optional WASM parse later |
| Language for draw | **TypeScript** |
| Language for parse | **TypeScript now**; WASM only if fidelity/sharing demands it |

---

## 8. Pointers into this repo

| Topic | Doc |
|-------|-----|
| SRK tags + preprocess | [../lane-editor-tags/projects/strassenraumkarte.md](../lane-editor-tags/projects/strassenraumkarte.md) |
| Map Machine | [../lane-editor-tags/projects/map-machine.md](../lane-editor-tags/projects/map-machine.md) |
| osm2streets / muv-osm | [../lane-editor-tags/projects/osm2streets.md](../lane-editor-tags/projects/osm2streets.md), [../lane-editor-tags/projects/muv-osm.md](../lane-editor-tags/projects/muv-osm.md) |
| OsmLaneVisualizer (HTML cross-section) | [../lane-editor-tags/projects/osm-lane-visualizer.md](../lane-editor-tags/projects/osm-lane-visualizer.md) |
| Placement tags | [../lane-editor-tags/tags/placement.md](../lane-editor-tags/tags/placement.md) |
| Road markings (approved) | [../lane-editor-tags/tags/road-marking.md](../lane-editor-tags/tags/road-marking.md) |
| Width measurement semantics | [../width-measurements/](../width-measurements/) |

---

## 9. External demos / code

| Resource | URL |
|----------|-----|
| Map Machine | https://github.com/enzet/map-machine |
| A/B Street osm_viewer | https://play.abstreet.org/0.3.49/osm_viewer.html |
| osm2streets lane editor | https://a-b-street.github.io/osm2streets/lane_editor.html |
| Straßenraumkarte Neukölln | https://strassenraumkarte.osm-berlin.org/ |
| SRK preprocess | https://github.com/osmberlin/strassenraumkarte-neukoelln/blob/main/mapstyle/post_processing.py |
| Imagico maze pt.2 | https://blog.imagico.de/navigating-the-maze-part-2/ |
| A/B Street geometry deep dive | https://a-b-street.github.io/docs/tech/map/geometry/index.html |
| OSM Sidewalkreator | DOI 10.48088/ejg.k.ves.14.4.066.084 |
