# Lane editor OSM tags — research

Research package for a future OSM lane editor: which tags to read and write, how access tags differ from physical lane geometry, how existing tools interpret the same data, and which external test fixtures to adopt. Surveys projects from [AB Street discussion #789](sources/abstreet-discussion-789.md), consolidates tag coverage in one reference table, and tracks open confirmations below.

Siblings: [width-measurements](../width-measurements/) (how OSM width tags are measured and interact); [lane-rendering](../lane-rendering/) (algorithms and literature for drawing lanes / bike / sidewalk / crossings from centreline data). Index: [../README.md](../README.md).

## Quick start

- Start with [tags/consolidated-tag-reference.md](tags/consolidated-tag-reference.md)
- Conceptual model: [tags/access-vs-physical.md](tags/access-vs-physical.md)
- Historical origin: [sources/abstreet-discussion-789.md](sources/abstreet-discussion-789.md)

## Projects

Filenames prefixed with `_` are **peripheral** for this research package (adjacent UX, navigation consumers, or shallow stubs) — kept for cross-links, not primary lane-tag modelling.

### Core

| File | Project | Role | Priority for our editor |
|------|---------|------|-------------------------|
| [muv-osm.md](projects/muv-osm.md) | muv-osm (Muv) | Active per-way lane parser; osm2streets delegates here since PR #233 | **High** — primary parsing gold standard |
| [osm2streets.md](projects/osm2streets.md) | osm2streets | Street network, lane rendering, lane editor experiment | **High** — target integration stack |
| [osm2lanes.md](projects/osm2lanes.md) | osm2lanes (archived) | Original tags→lanes library, JSON fixtures, web demo | **High** — fixture inventory; parser superseded |
| [bjornrasmussen-josm-lanes.md](projects/bjornrasmussen-josm-lanes.md) | BjornRasmussen/Lanes | JOSM visual lane editor plugin (experimental) | **High** — closest structural editor UX |
| [josm-lane-and-road-attributes.md](projects/josm-lane-and-road-attributes.md) | JOSM Lane and Road Attributes | Active MapCSS lane QA style + preset | **High** — de facto JOSM lane QA |
| [josm-turnlanes-tagging.md](projects/josm-turnlanes-tagging.md) | JOSM turnlanes-tagging | Maintained `turn:lanes` editor plugin | **High** — focused turn-lane editor |
| [strassenraumkarte.md](projects/strassenraumkarte.md) | Straßenraumkarte Neukölln | Berlin micromap; placement/width/`cycleway:lanes` consumer | **Medium** — real-world DE tagging patterns |
| [osm-lane-visualizer.md](projects/osm-lane-visualizer.md) | OsmLaneVisualizer | QA tool covering 105+ lane-related keys | **Medium** — tag coverage checklist |
| [map-machine.md](projects/map-machine.md) | Map Machine | Experimental road-lanes static map renderer | **Medium** — width/placement rendering reference |
| [id-editor-discussions.md](projects/id-editor-discussions.md) | iD #387 | Editor UX history and open design questions | **Medium** — UX precedent |
| [josm-lane-features.md](projects/josm-lane-features.md) | JOSM `lane_features` | Older MapCSS lane QA style | **Low** — semantics reference |
| [josm-turnlanes-core.md](projects/josm-turnlanes-core.md) | JOSM Turn Lanes (core) | Older turn-relations plugin | **Low** — distinct from turnlanes-tagging |
| [id-pr-3822.md](projects/id-pr-3822.md) | iD PR #3822 | Abandoned map-overlay lane UI | **Low** — historical UX dead end |
| [abstreet-osm-viewer.md](projects/abstreet-osm-viewer.md) | AB Street osm_viewer | Early web lane viz / road editor | **Reference** — superseded by osm2streets |
| [berlin-verkehrswende-radwege.md](projects/berlin-verkehrswende-radwege.md) | Berlin Verkehrswende Radwege | DE cycleway tagging examples | **Reference** — fixture source |

### Peripheral (`_` prefix)

| File | Project | Role |
|------|---------|------|
| [_streetcomplete-cycleway-parser.md](projects/_streetcomplete-cycleway-parser.md) | StreetComplete CyclewayParser | `cycleway:*` fixture source (215+ tests) |
| [_twpol-osm-tiles.md](projects/_twpol-osm-tiles.md) | twpol/osm-tiles | Lane overlay tile renderer |
| [_shared-row.md](projects/_shared-row.md) | shared-row (Slice) | Target ROW vocabulary, not an OSM parser |
| [_osmand.md](projects/_osmand.md) | OsmAnd | Production `turn:lanes` navigation consumer |
| [_zlant-parking-lanes.md](projects/_zlant-parking-lanes.md) | zlant/parking-lanes | Parking micro-editor pattern |
| [_streetmix.md](projects/_streetmix.md) | Streetmix | Cross-section UX design reference |
| [_streetplan.md](projects/_streetplan.md) | StreetPlan | Cross-section UX design reference |
| [_3dstreet.md](projects/_3dstreet.md) | 3DStreet | 3D street viz from Streetmix segments |
| [_bhousel-codepen.md](projects/_bhousel-codepen.md) | bhousel CodePen | SVG cross-section mockup |
| [_cyclestreets-areahighway.md](projects/_cyclestreets-areahighway.md) | CycleStreets SOTM 2019 | `area:highway` junction routing |

## Tag topics

| File | Description |
|------|-------------|
| [access-vs-physical.md](tags/access-vs-physical.md) | Separates access/mode tags (`*:lanes`) from physical lane geometry |
| [lanes-count.md](tags/lanes-count.md) | `lanes=*` and directional counts — what is included and excluded |
| [turn-lanes.md](tags/turn-lanes.md) | `turn:lanes` syntax, values, and connectivity relations |
| [placement.md](tags/placement.md) | Way offset vs road cross-section (`placement=*`, transitions) |
| [width-and-surface.md](tags/width-and-surface.md) | Short card: `width`, `width:lanes`, per-lane surface — deep dive in [../width-measurements/](../width-measurements/) |
| [bicycle-lanes.md](tags/bicycle-lanes.md) | `cycleway:*` roadside vs on-carriageway `bicycle:lanes` / `cycleway:lanes` |
| [bus-lanes.md](tags/bus-lanes.md) | Bus/PSV count scheme vs `bus:lanes` / `psv:lanes` designation |
| [markings-and-change.md](tags/markings-and-change.md) | `lane_markings`, `change:lanes`, overtaking, separators |
| [road-marking.md](tags/road-marking.md) | Approved `road_marking=*` — separate geometries for junction markings, arrows, gores (not every lane line) |
| [separation-proposal.md](tags/separation-proposal.md) | Draft `separation` / `marking` / `traffic_mode` — protected bike lanes, lane edges, adjacent traffic context |
| [consolidated-tag-reference.md](tags/consolidated-tag-reference.md) | Master tag table with project coverage and editor priority |

## Test cases

- [test-cases/muv-osm.md](test-cases/muv-osm.md) — **~50 adoptable inline Rust tests** from LeLuxNet/Muv `muv-osm/src/lanes/**` (primary gold standard)
- [test-cases/osm2lanes-osm2streets.md](test-cases/osm2lanes-osm2streets.md) — ~90 adoptable cases from archived osm2lanes `tests.yml` and osm2streets area fixtures
- StreetComplete cycleway tests (~215 `@Test` functions) — see [projects/_streetcomplete-cycleway-parser.md](projects/_streetcomplete-cycleway-parser.md)
- Index: [test-cases/README.md](test-cases/README.md)

## Sources

- [00-sources-and-method.md](00-sources-and-method.md) — wiki pages, method, and source index
- [sources/abstreet-discussion-789.md](sources/abstreet-discussion-789.md) — full notes on discussion #789
- **Width package:** [../width-measurements/](../width-measurements/) — kerb vs lanes vs buffer measurement deep dive (+ [sources](../width-measurements/sources.md), [assets](../width-measurements/assets/))
- Research index: [../README.md](../README.md)
## Open confirmations

Collected from **Open questions** sections in project notes:

- **Gold standard:** Treat **muv_osm** (via osm2streets) as primary parser reference; archived osm2lanes `tests.yml` is secondary — outputs diverge on cycleway/oneway edge cases ([muv-osm.md](projects/muv-osm.md))
- **muv-osm:** Will the crate be published to crates.io or stay Git-only? `share_busway` merge status? Warning API for editor UX?
- **Map Machine:** Current lane-tag coverage confirmed in [map-machine.md](projects/map-machine.md); open: `turn:lanes` / `change:lanes` roadmap, directional `placement`, country-specific default lane width
- **Straßenraumkarte:** Is `cycleway:lanes` canonical in Neukölln vs unimplemented `bicycle:lanes` / `vehicle:lanes`? Published preprocessed lane dataset URL? Live tile script version?
- **twpol/osm-tiles:** Live deploy from current `main`? LHT behaviour? Shared test-suite contribution still viable? ([_twpol-osm-tiles.md](projects/_twpol-osm-tiles.md))
- **BjornRasmussen/Lanes:** Was the plugin ever in the official JOSM plugin manager?
- **iD / other:** quincylvania lane mockup code open-sourced? ([#387](https://github.com/openstreetmap/iD/issues/387#issuecomment-447620208)); kepta GSoC proposal (2016) Google Doc not fetched
- **OsmLaneVisualizer:** ~~deprecated `parking:lane`?~~ resolved — **not in current code**; `vehicle:lanes` referenced in `makeAccess` but never loaded ([osm-lane-visualizer.md](projects/osm-lane-visualizer.md))
- **JOSM Turn Lanes:** Which plugin [#387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785) criticizes — [turnlanes-tagging](projects/josm-turnlanes-tagging.md) or [core](projects/josm-turnlanes-core.md)?
- **Forum:** [Making lanes orthogonal](https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033) mentions multiple tools / one “outdated / failed proposal” — exact list needs thread read

### Optional deeper research

Shallow project notes not yet turned into fixtures:

- **Berlin Verkehrswende Radwege** — exemplar way IDs → fixtures; see [berlin-verkehrswende-radwege.md](projects/berlin-verkehrswende-radwege.md); separation in [tags/separation-proposal.md](tags/separation-proposal.md); width in [../width-measurements/](../width-measurements/)
- **CycleStreets SOTM2019 / area:highway** — see [_cyclestreets-areahighway.md](projects/_cyclestreets-areahighway.md)
- **3DStreet OSM import path** — see [_3dstreet.md](projects/_3dstreet.md)
- **Streetmix data model vs `:lanes`** (no OSM export) — see [_streetmix.md](projects/_streetmix.md)
- **AB Street osm_viewer coverage limits** — see [abstreet-osm-viewer.md](projects/abstreet-osm-viewer.md)
- **Historical abstreet `lane_specs.rs` vs osm2lanes `tests.yml` diff** — cf. [abstreet-discussion-789.md §5](sources/abstreet-discussion-789.md) (`lane_specs.rs` link)
- **Locate enzet 2021 Python/Kotlin osm2lanes test ports** — needs confirmation; see [map-machine.md](projects/map-machine.md)

## Folder layout

```
lane-editor-tags/          ← lanes / :lanes research (this package)
├── README.md
├── 00-sources-and-method.md
├── sources/
│   └── abstreet-discussion-789.md
├── projects/
│   ├── *.md              ← core notes
│   └── _*.md             ← peripheral (lower relevance here)
├── tags/
│   ├── width-and-surface.md  ← short card → ../width-measurements/
│   └── *.md
└── test-cases/
    └── …

../width-measurements/     ← separate width measurement research
├── README.md              ← deep dive
├── sources.md
└── assets/
```
