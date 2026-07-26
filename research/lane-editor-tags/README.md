# Lane editor OSM tags — research

Research package for a future OSM lane editor: which tags to read and write, how access tags differ from physical lane geometry, how existing tools interpret the same data, and which external test fixtures to adopt. Surveys projects from [AB Street discussion #789](sources/abstreet-discussion-789.md), consolidates tag coverage in one reference table, and tracks open confirmations below.

## Quick start

- Start with [tags/consolidated-tag-reference.md](tags/consolidated-tag-reference.md)
- Conceptual model: [tags/access-vs-physical.md](tags/access-vs-physical.md)
- Historical origin: [sources/abstreet-discussion-789.md](sources/abstreet-discussion-789.md)

## Projects

| File | Project | Role | Priority for our editor |
|------|---------|------|-------------------------|
| [muv-osm.md](projects/muv-osm.md) | muv-osm (Muv) | Active per-way lane parser; osm2streets delegates here since PR #233 | **High** — primary parsing gold standard |
| [osm2streets.md](projects/osm2streets.md) | osm2streets | Street network, lane rendering, lane editor experiment | **High** — target integration stack |
| [osm2lanes.md](projects/osm2lanes.md) | osm2lanes (archived) | Original tags→lanes library, JSON fixtures, web demo | **High** — fixture inventory; parser superseded |
| [streetcomplete-cycleway-parser.md](projects/streetcomplete-cycleway-parser.md) | StreetComplete CyclewayParser | Read-only `cycleway:*` parser with 215+ tests | **High** — cycleway fixture source |
| [twpol-osm-tiles.md](projects/twpol-osm-tiles.md) | twpol/osm-tiles | Lane overlay tile renderer (C#) | **High** — cross-check consumer |
| [bjornrasmussen-josm-lanes.md](projects/bjornrasmussen-josm-lanes.md) | BjornRasmussen/Lanes | JOSM visual lane editor plugin (experimental) | **High** — closest structural editor UX |
| [strassenraumkarte.md](projects/strassenraumkarte.md) | Straßenraumkarte Neukölln | Berlin micromap; placement/width/`cycleway:lanes` consumer | **Medium** — real-world DE tagging patterns |
| [osm-lane-visualizer.md](projects/osm-lane-visualizer.md) | OsmLaneVisualizer | QA tool covering 105+ lane-related keys | **Medium** — tag coverage checklist |
| [map-machine.md](projects/map-machine.md) | Map Machine | Experimental road-lanes static map renderer | **Medium** — width/placement rendering reference |
| [shared-row.md](projects/shared-row.md) | shared-row (Slice) | Target ROW vocabulary, not an OSM parser | **Medium** — export schema direction |
| [id-editor-discussions.md](projects/id-editor-discussions.md) | iD #387 | Editor UX history and open design questions | **Medium** — UX precedent |
| [josm-lane-features.md](projects/josm-lane-features.md) | JOSM `lane_features` | Older MapCSS lane QA style | **Low** — semantics reference |
| [other-tools-and-visualizations.md](projects/other-tools-and-visualizations.md) | Other tools catalog | JOSM LRA, 3DStreet, Streetmix, AB Street, forum/wiki index | **Reference** — breadth and stubs |

## Tag topics

| File | Description |
|------|-------------|
| [access-vs-physical.md](tags/access-vs-physical.md) | Separates access/mode tags (`*:lanes`) from physical lane geometry |
| [lanes-count.md](tags/lanes-count.md) | `lanes=*` and directional counts — what is included and excluded |
| [turn-lanes.md](tags/turn-lanes.md) | `turn:lanes` syntax, values, and connectivity relations |
| [placement.md](tags/placement.md) | Way offset vs road cross-section (`placement=*`, transitions) |
| [width-and-surface.md](tags/width-and-surface.md) | Short card: `width`, `width:lanes`, per-lane surface and colour |
| [width-measurements.md](tags/width-measurements.md) | **Deep dive:** kerb vs lanes vs buffer vs cycle widths, paint rules, ROW gaps, tool behaviour (muv/SC), Streetmix-style diagrams |
| [bicycle-lanes.md](tags/bicycle-lanes.md) | `cycleway:*` roadside vs on-carriageway `bicycle:lanes` / `cycleway:lanes` |
| [bus-lanes.md](tags/bus-lanes.md) | Bus/PSV count scheme vs `bus:lanes` / `psv:lanes` designation |
| [markings-and-change.md](tags/markings-and-change.md) | `lane_markings`, `change:lanes`, overtaking, separators |
| [road-marking.md](tags/road-marking.md) | Approved `road_marking=*` — separate geometries for junction markings, arrows, gores (not every lane line) |
| [separation-proposal.md](tags/separation-proposal.md) | Draft `separation` / `marking` / `traffic_mode` — protected bike lanes, lane edges, adjacent traffic context |
| [consolidated-tag-reference.md](tags/consolidated-tag-reference.md) | Master tag table with project coverage and editor priority |

## Test cases

- [test-cases/muv-osm.md](test-cases/muv-osm.md) — **~50 adoptable inline Rust tests** from LeLuxNet/Muv `muv-osm/src/lanes/**` (primary gold standard)
- [test-cases/osm2lanes-osm2streets.md](test-cases/osm2lanes-osm2streets.md) — ~90 adoptable cases from archived osm2lanes `tests.yml` and osm2streets area fixtures
- StreetComplete cycleway tests (~215 `@Test` functions) — see [projects/streetcomplete-cycleway-parser.md](projects/streetcomplete-cycleway-parser.md)
- Index: [test-cases/README.md](test-cases/README.md)

## Sources

- [00-sources-and-method.md](00-sources-and-method.md) — wiki pages, method, and source index
- [sources/abstreet-discussion-789.md](sources/abstreet-discussion-789.md) — full notes on discussion #789
- [sources/width-measurements.md](sources/width-measurements.md) — wiki / ML / SC / Berlin / ERA sources for width semantics (+ [diagram assets](sources/width-assets/))

## Open confirmations

Collected from **Open questions** sections in project notes:

- **Gold standard:** Treat **muv_osm** (via osm2streets) as primary parser reference; archived osm2lanes `tests.yml` is secondary — outputs diverge on cycleway/oneway edge cases ([muv-osm.md](projects/muv-osm.md))
- **muv-osm:** Will the crate be published to crates.io or stay Git-only? `share_busway` merge status? Warning API for editor UX?
- **Map Machine:** Current lane-tag coverage confirmed in [map-machine.md](projects/map-machine.md); open: `turn:lanes` / `change:lanes` roadmap, directional `placement`, country-specific default lane width
- **Straßenraumkarte:** Is `cycleway:lanes` canonical in Neukölln vs unimplemented `bicycle:lanes` / `vehicle:lanes`? Published preprocessed lane dataset URL? Live tile script version?
- **twpol/osm-tiles:** Live deploy from current `main`? LHT behaviour? Shared test-suite contribution still viable?
- **BjornRasmussen/Lanes:** Was the plugin ever in the official JOSM plugin manager?
- **iD / other:** quincylvania lane mockup code open-sourced? OsmLaneVisualizer still using deprecated `parking:lane`?

### Optional deeper research

Shallow catalog entries not yet turned into fixtures or dedicated notes — see [other-tools-and-visualizations.md](projects/other-tools-and-visualizations.md) for context:

- **Berlin Verkehrswende Radwege wiki** — exemplar way IDs → fixtures ([wiki](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele)); separation already covered in [tags/separation-proposal.md](tags/separation-proposal.md); **width/buffer measurement** covered in [tags/width-measurements.md](tags/width-measurements.md)
- **CycleStreets SOTM2019 / area:highway junction context** — see [other-tools-and-visualizations.md § CycleStreets](projects/other-tools-and-visualizations.md#cyclestreets--sotm-2019-areahighway)
- **3DStreet OSM import path** — see [other-tools-and-visualizations.md § 3DStreet](projects/other-tools-and-visualizations.md#3dstreet)
- **Streetmix data model vs `:lanes`** (no OSM export) — design ref only; see [other-tools-and-visualizations.md § Streetmix](projects/other-tools-and-visualizations.md#streetmix)
- **AB Street osm_viewer coverage limits** — see [other-tools-and-visualizations.md § osm_viewer](projects/other-tools-and-visualizations.md#ab-street-osm_viewer--road-editor)
- **Historical abstreet `lane_specs.rs` vs osm2lanes `tests.yml` diff** — cf. [abstreet-discussion-789.md §5](sources/abstreet-discussion-789.md) (`lane_specs.rs` link)
- **Locate enzet 2021 Python/Kotlin osm2lanes test ports** — needs confirmation; see [map-machine.md](projects/map-machine.md)

## Folder layout

```
lane-editor-tags/
├── README.md                 ← this file
├── 00-sources-and-method.md
├── sources/
│   ├── abstreet-discussion-789.md
│   ├── width-measurements.md ← width wiki/ML/SC/Berlin source index
│   └── width-assets/         ← ERA / infraD measurement diagrams
├── projects/
│   └── *.md                  ← per-project research notes
├── tags/
│   ├── width-measurements.md ← width deep dive
│   └── *.md                  ← topic notes + consolidated reference
└── test-cases/
    ├── README.md
    ├── muv-osm.md
    └── osm2lanes-osm2streets.md
```
