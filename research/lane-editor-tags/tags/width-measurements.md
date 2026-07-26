# Width measurements in OSM street space

Deep dive on how OSM tags describe **physical widths** of roads, lanes, cycle infrastructure, buffers, and related limits — and how those tags interact. Companion to the shorter [width-and-surface.md](./width-and-surface.md). Source list and page summaries: [sources/width-measurements.md](../sources/width-measurements.md). Researched **2026-07-26**.

## Verdict (read this first)

| Question | Answer | Confidence |
|----------|--------|------------|
| What does `width=*` mean on a street? | **Carriageway kerb→kerb** (or edge→edge): includes on-street parking + on-carriageway cycle lanes; **excludes** sidewalks and off-kerb cycle tracks / street-side parking | **Clear** (wiki since ~2020; expect older fuzzy data) |
| Is `sum(width:lanes) == width`? | **Only when** there is no parking, no shoulder, and no untagged gutter/edge strip. Otherwise `width` is larger | **Clear** (StreetComplete #5593 + wiki) |
| Do motor `width:lanes` values include painted lines? | **Not documented** on the wiki. Practically: lane widths tile the usable strip; paint sits on the boundary between slots (shared, not double-counted). Gutters often sit **outside** `width:lanes` | **Situational / undocumented** |
| Do cycleway **usable** widths include paint? | Berlin practice: **distance between boundary lines** (`cycleway:*:width`) | **Clear for Berlin schema** |
| Do **buffer** widths include paint / hatching? | Berlin / ERA-style practice documented for OSM: **yes — markings are counted in `buffer`** | **Clear for Berlin numeric buffer**; global `cycleway:buffer` mostly `yes`/`no` |
| Is there a tag for total ROW (carriageway + sidewalks + green median)? | **No.** Compose from component widths / separate geometries | **Clear gap** |
| Narrowings? | **Split the way** and set `width=*` (or `est_width`) on the narrow segment; optional `narrow=yes` / `hazard=road_narrows` | **Clear** |

---

## 1. Hierarchical model of the street space

OSM does **not** store one “streetscape width”. Widths attach to **components**. Think Streetmix slices:

```text
 FULL RIGHT-OF-WAY  (no single OSM width tag)
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ sidewalk:*:width │ green / verge │████ CARRIAGEWAY width=* ████│ green │ sidewalk │
 │  (or separate    │ (often no     │ parking + lanes + bike +     │       │          │
 │   highway=footway│  width tag)   │ buffer + gutter              │       │          │
 │   + width)       │               │                              │       │          │
 └──────────────────────────────────────────────────────────────────────────┘
```

### Carriageway zoom (`width=*`)

```text
 width=*  =  kerb ◄──────────────────────────────────────────────────────► kerb
             │                                                              │
             │  parking:L:width │ lanes… │ buffer │ cycle │ parking:R:width │
             │  (if on-street)  │        │        │ lane  │ (if on-street)  │
             │                                                              │
             │         sum(width:lanes)  ≈  through-traffic strip           │
             │         (bike slots IN :lanes schema; parking OUT)           │
             │                                                              │
             └─ gutters / edge strips often untagged (≈0.2–0.5 m total) ───┘
```

### Legend for the diagrams below

| Symbol | Meaning |
|--------|---------|
| `█` | Motor travel lane |
| `▓` | On-street parking |
| `▒` | Cycle lane / Schutzstreifen / Radfahrstreifen |
| `░` | Buffer / barred area / hatch (paint counted in buffer) |
| `·` | Untagged gutter / edge strip |
| `│` | Kerb / edge of carriageway |
| `┊` | Painted line (shared boundary between adjacent width slots) |

---

## 2. Deep dive per tag

### 2.1 `width=*` (and `width:carriageway=*`)

| | |
|--|--|
| **Meaning** | Actual physical width of the tagged feature. On streets: **carriageway kerb→kerb / edge→edge**. |
| **Includes** | On-street parking lanes; on-carriageway cycle lanes (`cycleway=lane`); shoulders if part of paved carriageway edge practice |
| **Excludes** | Sidewalks; separately mapped cycle tracks; street-side / off-kerb parking |
| **Unit** | Metres by default; decimal **dot** (`width=3.5`, not `3,5`) |
| **Status** | de facto |
| **Synonym** | `width:carriageway=*` — same meaning today; **prefer `width=*`** ([Key:width](https://wiki.openstreetmap.org/wiki/Key:width)) |

**Provenance:** Prefer measured `width=*`. If only guessed → `est_width=*` (or `source:width=*` / StreetComplete `source:width=ARCore`).

**Historical fuzziness:** Until the 2020 tagging ML thread and wiki update (Supaplex030), three interpretations competed: (1) effective driving strip only, (2) kerb-to-kerb with parking, (3) full cross-section with sidewalks. Wiki now documents (2); data consumers must still expect (1)/(3) in older edits ([Talk:Key:width](https://wiki.openstreetmap.org/wiki/Talk:Key:width), [tagging ML Sep 2020](https://lists.openstreetmap.org/pipermail/tagging/2020-September/055362.html)).

**DE wiki note:** [DE:Key:width](https://wiki.openstreetmap.org/wiki/DE:Key:width) is thinner — units, `est_width`, and the distinction `maxwidth` vs `maxwidth:physical` — and does **not** reproduce the EN “Width of streets” section. Use EN for street semantics.

---

### 2.2 `width:lanes=*` (+ `:forward` / `:backward` / `:start` / `:end`)

| | |
|--|--|
| **Meaning** | Per-lane physical widths, pipe-separated left→right in driving direction ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes), [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren)) |
| **Pipe count** | Follows `*:lanes` schema → **includes bicycle lanes** as slots; **excludes parking / standing traffic** |
| **vs `lanes=*`** | `lanes=*` counts motor full-width lanes only → pipe count of `width:lanes` may be **greater** than `lanes` |
| **Tapers** | `width:lanes:start` / `:end` with `placement=transition` (e.g. ending lane → `0`) |
| **Status** | Documented but scarce (~8k uses globally at SC #5593 time); EN Key:width mentions it briefly |

**Interaction with `width=*` (StreetComplete #5593):**

> `width` includes parking, bike lanes, shoulders; `width:lanes` covers flowing-traffic lanes in the `:lanes` schema. Adding `width` beside existing `width:lanes` is **not** always redundant — especially with parking / bike lanes / gutters. ([westnordost](https://github.com/streetcomplete/StreetComplete/issues/5593))

Practical identity:

```text
width  ≈  sum(width:lanes)  +  parking widths  +  shoulders  +  untagged edge/gutter
```

When parking and shoulder are absent / tagged `no`, westnordost still expects a small residual (≈ **0.2–0.5 m**) for gutter / edge paint that mappers rarely model as `shoulder`.

**Paint / Markierungen for motor lanes:** Wiki is silent. Working assumption for editors:

1. Adjacent `width:lanes` slots meet at the **shared** painted line (do not add full paint width to both lanes).
2. German solid edge lines are often **0.12 m** (standard) or **0.25 m** (wide); centre dashed lines similar order — enough that double-counting both sides of every lane would invent ~0.5 m of “phantom” width on a two-lane road.
3. Soft validation: `|width − sum(slots) − parking − known buffers|` small; do not hard-require equality.

---

### 2.3 `est_width=*`

Estimated width when measurement is uncertain. Same semantics as `width=*` ([Key:est_width](https://wiki.openstreetmap.org/wiki/Key:est_width)). Prefer over inventing precise `width` from aerial guesswork.

---

### 2.4 `width:effective=*`

Rarely used. Intended as usable width for flowing traffic (`width` minus parking, etc.). Wiki itself calls the measurement boundary unclear “with or without markings, relocated vehicles, …” — prefer deriving from `width` + parking scheme or from `width:lanes`.

---

### 2.5 `maxwidth=*` vs `maxwidth:physical=*`

| Tag | Meaning | Sign required? |
|-----|---------|----------------|
| `maxwidth=*` | **Legal** maximum vehicle width | Typically signed |
| `maxwidth:physical=*` | **Physical** clearance (bridge pier, gate opening, …) | No |
| `width=*` | Actual width of the **feature** (road surface, path, …) | Survey |

Do not confuse these three ([Key:maxwidth](https://wiki.openstreetmap.org/wiki/Key:maxwidth), [Key:maxwidth:physical](https://wiki.openstreetmap.org/wiki/Key:maxwidth:physical), DE Key:width). Per-lane legal limits: `maxwidth:lanes=*`.

There is **no** established `min_width=*` for roads. For narrowings use `width=*` on a split segment, `narrow=yes`, and/or `hazard=road_narrows`.

---

### 2.6 Side feature widths

| Tag | Role | Inside `width=*`? |
|-----|------|-------------------|
| `parking:left/right/both:width` | On-street parking strip | **Yes** if parking is on the carriageway |
| `shoulder:width` / `shoulder:left:width` | Shoulder | Situational (often edge of carriageway) |
| `cycleway:left/right/both:width` | Cycle lane/track tagged **on** the highway | **Yes** for `=lane`; **No** for separate `highway=cycleway` |
| `sidewalk:left/right/both:width` | Sidewalk on highway tags | **Outside** `width=*` |
| `cycleway:width` / `footway:width` on segregated path | Split of shared path | On the **path** way’s own `width` |

---

### 2.7 Cycleway width — `cycleway:*:width` / path `width=*`

Berlin / Verkehrswende schema ([Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege)):

> Breite = Abstand zwischen den **Begrenzungen / Begrenzungslinien** (distance between the boundaries / boundary lines). Measure on site; if only estimated → `est_width`.

So for Radfahrstreifen / Schutzstreifen the tagged width is the **usable strip between the limiting lines**, not “usable asphalt plus both paint strokes”.

On a **separate** `highway=cycleway` / `path`, use plain `width=*` (and `cycleway:width` + `footway:width` when `segregated=yes`).

**Inventory survey practice (infraD example):** geometry reference from the **left edge of the cycling facility (RVA)** in travel direction; width measured from that edge ([uploaded survey slide](../sources/width-assets/infrad-geometry-left-edge.png)).

---

### 2.8 Buffer — `cycleway:*:buffer` / `buffer:left/right`

| Variant | Where | Values |
|---------|-------|--------|
| `cycleway:buffer` / `:left` / `:right` / `:both` | Cycleway tagged **on** main road | Mostly `yes`/`no`; numeric metres less common globally ([Key:cycleway:buffer](https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer)) |
| `cycleway:SIDE:buffer:SIDE` | Berlin extended schema | Metres or `yes`/`no` — space between cycle strip and adjacent traffic |
| `buffer:left/right` | On separate cycleway way | Same idea without `cycleway:` prefix |

**Berlin / ERA measurement rule (critical):**

> Numeric buffer widths **include the painted lines** that bound the buffer (hatched barred area + both edge lines).

Documented against German design drawings and Berlin meetup notes (“Hier werden die Markierungen mitgezählt!”):

![ERA buffer including paint](../sources/width-assets/era-buffer-includes-paint.png)

Example from the drawing:

```text
 buffer ≥ 1.00 m  =  0.12 (line) + ≥0.63 (hatch) + 0.25 (wide line)
 cycle  ≥ 2.00 m  starts at the outer edge of the 0.25 m line (not mid-paint)
 motor  ≥ 3.00 m  ends at the outer edge of the buffer’s left line
```

So:

- **`cycleway:*:buffer=1`** ≈ full paint+hatch package.
- **`cycleway:*:width=2`** ≈ clear riding width between boundaries (paint of the buffer’s cycle-side line is attributed to the buffer, not added again to the cycle width).

Hatched / barred areas belong in **`buffer`** (and optionally `marking=barred_area` / separation proposal), **not** as an inflation of `width=*` beyond the kerb-to-kerb total, and **not** as a motor `width:lanes` slot unless you explicitly model a non-traffic separator slot (unusual; muv inserts a width-only buffer lane instead).

---

### 2.9 Related geometry tags (not widths, but affect interpretation)

| Tag | Role |
|-----|------|
| `placement=*` | Where the OSM centreline sits in the cross-section |
| `lane_markings=yes/no` | Whether lanes are painted at all |
| `change:lanes` / `overtaking` | What the paint **means** legally, not its millimetres |
| `separation` / `marking` (draft) | Physical vs painted separation type; buffer width is companion |
| `narrow=yes` | Relative narrowing |
| `hazard=road_narrows` | Signed / notable narrowing point |

---

## 3. Interaction matrix (street space)

### 3.1 What adds up to what?

| Aggregate | Typical formula | Notes |
|-----------|-----------------|-------|
| Carriageway `width` | kerb→kerb survey | Prefer direct measure |
| Effective driving width | `width − Σ parking:width` **or** `Σ width:lanes` (motor slots) | Ambiguous with unmarked parking |
| Full `:lanes` strip | `Σ width:lanes` (all pipes incl. bike) | Excludes parking |
| On-road cycle package | `cycleway:*:width + cycleway:*:buffer(:*)` | Buffer includes paint (Berlin) |
| Full ROW | sidewalks + verges + carriageway + medians | **No tag** — sum components or use areas |

### 3.2 Scenario A — simple two-lane street, no parking

```text
│·┊████ 3.0 ┊████ 3.0 ┊·│
 width=6.2
 width:lanes=3|3
 → residual 0.2 m gutters (untagged) — OK
```

### 3.3 Scenario B — parking + bike lane + buffer (Berlin-style)

```text
│▓ parking 2.0 │█ motor 3.0 │░ buffer 1.0 │▒ cycle 2.0 │
 kerb ◄──────────────── width=* = 8.0 ────────────────► kerb

 Tags (illustrative):
   width=8
   lanes=1
   parking:right=lane + parking:right:width=2
   cycleway:right=lane
   cycleway:right:width=2
   cycleway:right:buffer:left=1          ← paint INCLUDED
   width:lanes=3|2                       ← motor + bike only (parking out)
```

Check: `2 + 3 + 1 + 2 = 8` ✓. Here `sum(width:lanes)+parking+buffer = width`.

If bike is **only** in `cycleway:*:width` and **also** appears as a `width:lanes` slot, do not double-count in editor math — pick one modelling style per way (Straßenraumkarte often puts bike in `width:lanes`; Berlin side-tags use `cycleway:*:width`).

### 3.4 Scenario C — separate cycle track + green strip

```text
│ sidewalk │ green ││ cycleway width=2 ││ green ││ carriageway width=7 ││ …
                 separate OSM ways              main highway
```

- Main highway `width` does **not** include the cycle track.
- Green strip: usually **no** width on the highway; map as area / `separation=greenery` / verge — **gap** if you need a total ROW metre value.
- Median with planting between dual carriageways: dual ways each with own `width`; median as separate area — again **no** `width:total_row`.

### 3.5 Scenario D — Schutzstreifen counted in `:lanes`

On-carriageway advisory bike lane is a `:lanes` slot (flowing traffic), so it appears in `width:lanes` / `bicycle:lanes` / `cycleway:lanes`, while `lanes=*` stays motor-only ([DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren), Berlin FAQ).

### 3.6 Narrowings / Verengungen

Analogous to `maxheight` at a bridge:

1. **Split** the way at the narrow section.
2. Tag **`width=*`** (or `est_width`) for the local carriageway width.
3. Optionally `narrow=yes` and/or `hazard=road_narrows` (+ traffic sign).
4. Talk consensus for routers: prefer **minimum** width along a segment rather than averaging ([Talk:Key:width](https://wiki.openstreetmap.org/wiki/Talk:Key:width) 2024).

Tapering lanes at junctions: `placement=transition` + `width:lanes:start/end` rather than a single averaged width.

---

## 4. Decision tree for mappers / editor UX

```mermaid
flowchart TD
  A[What are you measuring?] --> B{Object}
  B -->|Full kerb-to-kerb carriageway| C[width=* on highway]
  B -->|One flowing lane strip| D[width:lanes pipe slot]
  B -->|On-street parking| E[parking:*:width]
  B -->|Cycle lane on highway| F[cycleway:*:width]
  B -->|Paint/hatch buffer beside cycle| G["cycleway:*:buffer = metres — INCLUDE paint"]
  B -->|Separate cycleway/footway| H[width=* on that way]
  B -->|Sidewalk on highway tags| I[sidewalk:*:width — outside width]
  B -->|Legal vehicle limit| J[maxwidth=*]
  B -->|Physical clearance| K[maxwidth:physical=*]
  B -->|Guess only| L[est_width=* / source:width]
  B -->|Local pinch point| M[Split way + width=* + optional narrow=yes]
  B -->|Whole ROW incl. greens/sidewalks| N[No single tag — sum parts / areas]
```

### Soft consistency checks (editor)

1. Warn if `width` present and `sum(width:lanes) > width` (impossible if units correct).
2. Warn if `sum(width:lanes) + Σ parking:width + Σ buffers ≪ width` by >0.5 m without shoulder/gutter explanation.
3. Warn if `width:lanes` pipe count ≠ other `:lanes` attributes’ pipe counts.
4. Do **not** suppress asking for `width` merely because `width:lanes` exists (SC wontfix rationale) — but **do** show derived sum as a hint to the surveyor.

---

## 5. Tool behaviour (width focus)

### 5.1 muv-osm (primary parser gold standard)

From [muv-osm.md](../projects/muv-osm.md) + upstream `highway.rs` / `side_lanes.rs` / `direction.rs` / `base.rs` (fetched 2026-07-26):

| Input | Behaviour |
|-------|-----------|
| `width` / `width:carriageway` under `width:` tree | Carriageway width; `distribute_full_width` across lanes lacking explicit width |
| `est_width` | Fallback carriageway width |
| `width:lanes` (+ dirs) | Per-lane `Quantity` via direction parser |
| `parking:*:width` | Parking lane width; subtracted from distribution in tests |
| `cycleway:*:buffer` (numeric) | Inserts a **width-only buffer lane** between cycle side-lane and carriageway |
| Markings / paint mm | **Not modelled** — separators are kerb indices + buffer widths |

Test `lane_widths`: `width=8` + parking 3 m + bike/vehicle lanes → remaining width split across travel lanes. Test `cycleway_buffer`: `0.2` / `0.75` become lane widths on buffer slots.

**Editor implication:** Numeric Berlin buffers round-trip cleanly into muv as separator slices; `yes`/`no` buffers do not produce metres.

### 5.2 StreetComplete

- Quest `AddRoadWidth` asks for `width` even when `width:lanes` or `width:carriageway` exists ([#5593](https://github.com/streetcomplete/StreetComplete/issues/5593), closed **wontfix**).
- Rationale: `width` is ~1000× more used; consumers often ignore fringe keys; residual gutter gap; parking/shoulder filters would be complex.
- Measurement via StreetMeasure → `source:width=ARCore`.

### 5.3 Straßenraumkarte Neukölln

Heavy consumer of `width:lanes`, defaults (3.0 / 1.5 / 2.2 m), `cycleway:*:buffer` offsets, `width:effective` fallback — see [strassenraumkarte.md](../projects/strassenraumkarte.md).

### 5.4 Others (width-relevant only)

| Tool | Width behaviour |
|------|-----------------|
| JOSM `lane_features` | Default **3.5 m × lanes** if `width` missing |
| OsmLaneVisualizer | Optional lanewidth mode |
| Map Machine | Width from `width` or inferred from `lanes` |
| osm2streets | Consumes muv lane widths for rendering |

---

## 6. Empirical / reference diagrams (non-OSM standards vs OSM tags)

German design drawings used as **measurement convention** references (not OSM tags themselves):

| Asset | What it shows | OSM mapping |
|-------|---------------|-------------|
| [era-buffer-includes-paint.png](../sources/width-assets/era-buffer-includes-paint.png) | Buffer ≥1.00 = 0.12 + hatch + 0.25; cycle ≥2.00 after wide line | `cycleway:*:buffer` includes paint; `cycleway:*:width` is clear width |
| [era-markings-stack.png](../sources/width-assets/era-markings-stack.png) | Stacked minima (≥2.00 / 0.63 / 2.25) relative to solid/dashed lines | Documents how standards dimension to paint edges |
| [infrad-geometry-left-edge.png](../sources/width-assets/infrad-geometry-left-edge.png) | Survey geometry from left edge of RVA | Separate-cycleway centreline / width origin practice |
| [File:Radweg Edinburger Straße…](https://wiki.openstreetmap.org/wiki/File:Radweg_Edinburger_Stra%C3%9Fe_beschriftet.jpg) | Berlin labelled photo with widths on cycleway + buffers | Example of meetup tagging practice |

Wiki file history note (2025-07-14): “fix buffer left” on the Edinburger image — buffer annotation was corrected, underscoring how easy buffer extents are to mis-draw.

---

## 7. Gaps & open questions

1. **No wiki rule** for whether motor `width:lanes` includes half a painted line — needs a short Key:width clarification or editor convention note.
2. **No `width` for full ROW** including both sidewalks + planted median / boulevard — intentional; micromappers use areas.
3. **Global `cycleway:buffer`** usage is mostly boolean; numeric+paint-included rule is **Berlin/DE strong practice**, not universal wiki text on Key:cycleway:buffer.
4. **Dual tagging** (`cycleway:*:width` **and** bike slot in `width:lanes`) — pick one primary for sum checks.
5. **Unpaved / rural** roads: tagging ML showed no single “width” definition (obstacle-free vs driven ruts) — urban kerb rule does not travel well.
6. **DE Key:width** should ideally link/translate the EN “Width of streets” section to reduce DE/EN drift.

---

## 8. Editor requirements (width)

**Must**

- Carriageway `width` field with metre parsing (dot decimals).
- Per-slot `width:lanes` aligned with other `:lanes` columns.
- Side fields: `parking:*:width`, `cycleway:*:width`, numeric `cycleway:*:buffer`.
- Soft sum visualisation (Streetmix-like bar) showing kerb→kerb vs parts.
- Distinguish `maxwidth` / `maxwidth:physical` / `width` in UI copy.

**Should**

- Warn on inconsistent sums; explain gutter residual.
- `est_width` / `source:width` for uncertain surveys.
- Split-way helper for narrowings (local `width`).
- Document Berlin paint-in-buffer rule in help text when region=DE.

**Nice**

- Import measurement from map measure tool / StreetMeasure.
- Toggle: “buffers include markings (DE)” for QA overlays.
- Optional ROW composition view (sidewalk + verge + carriageway) without inventing a new OSM key.

---

## Links

| Resource | URL |
|----------|-----|
| Source index (this research) | [sources/width-measurements.md](../sources/width-measurements.md) |
| Key:width | https://wiki.openstreetmap.org/wiki/Key:width |
| Lanes / width:lanes | https://wiki.openstreetmap.org/wiki/Lanes |
| Berlin Radwege schema | https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege |
| StreetComplete #5593 | https://github.com/streetcomplete/StreetComplete/issues/5593 |
| Tagging ML 2020 width thread | https://lists.openstreetmap.org/pipermail/tagging/2020-September/055362.html |
| Shorter tag note | [width-and-surface.md](./width-and-surface.md) |
