# AB Street discussion #789 — Shared OSM tags → lane specification

**Source:** [a-b-street/abstreet discussions #789](https://github.com/a-b-street/abstreet/discussions/789)  
**Started:** 2021-10-25 by @dabreegster  
**Fetched:** 2026-07-25

---

## 1. Overview

In October 2021, @dabreegster proposed extracting A/B Street’s OSM-way → ordered-lane-spec logic into a **shared library** for cross-project reuse. The thread is the primary historical origin of what became [a-b-street/osm2lanes](https://github.com/a-b-street/osm2lanes) (later absorbed into osm2streets).

Stakeholders explicitly pinged in the opening post:

| Handle | Affiliation / context |
|--------|----------------------|
| @westnordost | StreetComplete |
| @matkoniecz | OSM community |
| @enzet | Map Machine |
| @BjornRasmussen | JOSM Lanes plugin |
| @tordans | Berlin Verkehrswende Radwege tagging examples |
| @d-wasserman | shared-row / OSM Derived Shared-ROW Data |
| @mvl22 | CycleStreets; area:highway junction context |
| @kfarr | 3D Street |

Core questions to stakeholders: (1) would a shared tags→lanes library be useful, (2) would they contribute.

---

## 2. Proposed API

**Input:** `Map<String,String>` tags for a **single OSM way**, plus locale config (driving side, regional defaults such as cyclists in bus lanes).

**Output:** ordered left-to-right lane specifications. Initial example from [way/428294122](https://www.openstreetmap.org/way/428294122) (`lanes=2`, `oneway=yes`, `sidewalk=both`, `cycleway:left=lane`):

```
[
  {lane_type = sidewalk, width = 2m, dir = backwards},
  {lane_type = bike lane, width = 2.5m, dir = forwards},
  {lane_type = general purpose, width = 3m, dir = forwards},
  {lane_type = general purpose, width = 3m, dir = forwards},
  {lane_type = sidewalk, width = 2m, dir = forwards},
]
```

### Lane spec fields (v1 + desired extensions)

| Field | v1 | Desired extension |
|-------|----|-------------------|
| Lane type | general-purpose, bus, bike, sidewalk, center turn, parking, buffers/separators | richer separator taxonomy |
| Width | metres; guessed when untagged | provenance on width (see §3) |
| Direction | forwards / backwards | bidirectional movement per traffic type |
| Turn restrictions | — | `turn:lanes` |
| Vehicle access | — | per-lane allowed modes (bus lane + taxi/HOV/bike) |
| Time restrictions | — | possibly post-v1 |

**Design constraints stated:**

- Explicit schema, not free-form OSM tagging inside the output.
- **Single way only** — parallel cycleways/footways on separate ways are out of scope for the library.
- Widths: either reasonable guesses from locale or omit / mark missing.

**Implementation sketch:** JSON (+ schema) output; Rust reference impl from [abstreet `lane_specs.rs`](https://github.com/a-b-street/abstreet/blob/master/map_model/src/make/initial/lane_specs.rs) (WASM/FFI/CLI); Python second impl suggested by @enzet; **shared JSON test cases** as first deliverable.

---

## 3. Design decisions debated

### Single-way vs multi-way consolidation

| Position | Author | Summary |
|----------|--------|---------|
| Multi-way input | @tordans | Model the full street between building lines (Streetmix-like); accept multiple OSM ways and consolidate. |
| Caller responsibility | @dabreegster | “Holy grail” but hard: caller must group parallel ways; library cannot resolve `cycleway=sidepath` without the sidepath way or left/right geometry. |

**Outcome in osm2lanes:** single-way scope retained (see [osm2lanes.md](../projects/osm2lanes.md)).

### Defaults vs provenance

@tordans proposed `source` on inferred attributes (e.g. width from assumed default vs `width:carriageway` vs calculated). @dabreegster agreed — especially for heuristic `turn:lanes` from lane count. Canonical metres for all widths.

**Outcome:** `spec-lanes.json` uses `source: osm` vs `osm2lanes` on widths; broader provenance model still relevant for our editor.

### Bidirectional transform (tags ↔ lanes)

@westnordost: for editors, tags→lanes is “half the rent”; **lanes→tags** is the other half. @dabreegster agreed; same test suite could round-trip.

**Round-trip difficulty noted:** multiple equivalent cycleway tagging styles; edits may require wiping lane tags or reconciling with existing style.

### Test-driven first deliverable

@tordans endorsed JSON/YAML fixtures with optional metadata (name, description, wiki links). @enzet ported tests to Python/Kotlin (Nov 2021). This became the [osm2lanes](https://github.com/a-b-street/osm2lanes) repository.

---

## 4. Stakeholders & projects mentioned

| Project | Person | Interest in #789 | Link | Already in our research? | Further investigation |
|---------|--------|------------------|------|--------------------------|------------------------|
| osm2lanes / osm2streets | @dabreegster | Reference implementation + lane editor path | https://github.com/a-b-street/osm2lanes | Yes — [osm2lanes.md](../projects/osm2lanes.md), [osm2streets.md](../projects/osm2streets.md) | Maintain sync with osm2streets crate |
| StreetComplete CyclewayParser | @westnordost | Cycleway Q&A; exhaustive tests | [CyclewayParser.kt](https://github.com/streetcomplete/StreetComplete/blob/master/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParser.kt) | Yes — [streetcomplete-cycleway-parser.md](../projects/streetcomplete-cycleway-parser.md) | — |
| shared-row Slice spec | @d-wasserman | Target lane-type vocabulary | [Slice.md](https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md) | Yes — [shared-row.md](../projects/shared-row.md) | — |
| Berlin Radwege examples | @tordans | Micromapping tagging patterns | [wiki](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele) | Partial — bicycle-lanes.md, strassenraumkarte | [README § Optional deeper research](../README.md#optional-deeper-research) |
| Straßenraumkarte | @tordans, @SupaplexOSM | Vector-tile visibility of interpreted lanes | [map](https://strassenraumkarte.osm-berlin.org/) | Yes — [strassenraumkarte.md](../projects/strassenraumkarte.md) | area:highway junction workflow |
| Streetmix | @tordans, @dabreegster | UX target; OSM tag recommendations | https://streetmix.net/ | Yes — other-tools (design ref) | [README § Optional deeper research](../README.md#optional-deeper-research) |
| iD lane editor | community | Long-running UI discussion | [iD #387](https://github.com/openstreetmap/iD/issues/387) | Yes — [id-editor-discussions.md](../projects/id-editor-discussions.md) | — |
| CycleStreets / area:highway | @mvl22 | Junction-area routing (SOTM 2019) | [talk](https://www.cyclestreets.org/news/2019/09/22/sotm2019/) | Partial — [other-tools](../projects/other-tools-and-visualizations.md#cyclestreets--sotm-2019-areahighway) | [README § Optional deeper research](../README.md#optional-deeper-research) |
| twpol/osm-tiles | @twpol | Lane overlay map; wants shared test suite | https://github.com/twpol/osm-tiles | Yes — [twpol-osm-tiles.md](../projects/twpol-osm-tiles.md) | — |
| Map Machine | @enzet | Consumer; lanes + width at time of comment | https://github.com/enzet/map-machine | Yes — [map-machine.md](../projects/map-machine.md) | [README § Optional deeper research](../README.md#optional-deeper-research) (2021 Python/Kotlin test ports) |
| JOSM Lanes plugin | @BjornRasmussen | Visual lane editor stakeholder | https://github.com/BjornRasmussen/Lanes | Yes — [bjornrasmussen-josm-lanes.md](../projects/bjornrasmussen-josm-lanes.md) | — |
| 3DStreet | @kfarr | 3D street viz; pinged stakeholder | https://github.com/3DStreet/3dstreet | Partial — [other-tools](../projects/other-tools-and-visualizations.md#3dstreet) | [README § Optional deeper research](../README.md#optional-deeper-research) |
| AB Street osm_viewer | @dabreegster | Web import + lane visualization goal | [osm_viewer](https://a-b-street.github.io/docs/software/osm_viewer.html) | Partial — osm2streets, [other-tools](../projects/other-tools-and-visualizations.md#ab-street-osm_viewer--road-editor) | [README § Optional deeper research](../README.md#optional-deeper-research) |
| AB Street road editor | @dabreegster | Limited lane edit UI retrospective | [retrospective](https://a-b-street.github.io/docs/project/retrospective/index.html#road-editor) | Partial — osm2streets lane editor | — |

---

## 5. Key linked resources from the thread

| Resource | URL | Role in discussion |
|----------|-----|-------------------|
| AB Street `lane_specs.rs` (2021) | https://github.com/a-b-street/abstreet/blob/master/map_model/src/make/initial/lane_specs.rs | Initial Rust tags→lanes impl + inline tests (~line 395 in cf3d00f) |
| StreetComplete CyclewayParser | https://github.com/streetcomplete/StreetComplete/blob/master/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParser.kt | Community cycleway parser reference |
| CyclewayParser tests | https://github.com/streetcomplete/StreetComplete/blob/master/app/src/commonTest/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParserKtTest.kt | Exhaustive cycleway test matrix |
| shared-row Slice spec | https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md | Slice types + meta for ROW model |
| Berlin Verkehrswende Radwege | https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele | Micromapping examples to support |
| Straßenraumkarte micromap (2021 preview) | https://supaplexosm.github.io/strassenraumkarte-neukoelln/?map=micromap#20/52.47400/13.44061 | Processing decisions for lane display |
| streetmix.net | https://streetmix.net/ | Cross-section UX; @tordans wants OSM tag output |
| iD #387 | https://github.com/openstreetmap/iD/issues/387 | Lane editing in iD |
| CycleStreets SOTM 2019 | https://www.cyclestreets.org/news/2019/09/22/sotm2019/ | `area:highway` junction routing |
| twpol/osm-tiles | https://github.com/twpol/osm-tiles | Lane overlay renderer |
| Live osm-tiles demo | https://osm-tiles.james-ross.co.uk/?map=19/51.5050/-0.0899&layer=standard&layer=all | Example @tordans re-shared Nov 2021 |
| Map Machine | @enzet (no URL in thread) | Planned lane tag support |
| osm2lanes repo | https://github.com/a-b-street/osm2lanes | Created from this discussion |
| AB Street osm_viewer | https://a-b-street.github.io/docs/software/osm_viewer.html | Area import + visualization |
| AB Street road editor retrospective | https://a-b-street.github.io/docs/project/retrospective/index.html#road-editor | Early edit UI |

---

## 6. Implications for our lane editor

1. **Bidirectional transform** — Plan for lanes→tags round-trip and test it; reconciling existing tagging styles is hard (@dabreegster, @westnordost).
2. **Provenance of defaults** — Surface whether width/access/turn data is tagged, assumed, or calculated (`source` per attribute); let consumers ignore heuristics.
3. **Multi-way grouping** — Full building-line cross-section is desired (@tordans) but explicitly deferred to callers; **out of v1** unless we own grouping logic.
4. **Test-driven development** — Shared fixture format was the agreed first step; adopt parsers’ test cases (StreetComplete cycleway, osm2lanes YAML, twpol Roads.cs).
5. **Visualization as QA** — @tordans: interpreted lane maps improve tagging; aligns with Straßenraumkarte / osm-tiles / OsmLaneVisualizer approach.
6. **Streetmix-like output** — @tordans’s stated priority: tool that outputs OSM tagging recommendations, not only a shared lane file format.

---

## 7. Source index

- https://github.com/a-b-street/abstreet/discussions/789
- https://github.com/a-b-street/osm2lanes
- https://github.com/a-b-street/abstreet/blob/master/map_model/src/make/initial/lane_specs.rs
- https://github.com/streetcomplete/StreetComplete/tree/master/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway
- https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md
- https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele
- https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update
- https://github.com/twpol/osm-tiles
- https://github.com/BjornRasmussen/Lanes
- https://github.com/openstreetmap/iD/issues/387
- https://www.cyclestreets.org/news/2019/09/22/sotm2019/
