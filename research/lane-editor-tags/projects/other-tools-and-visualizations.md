# Other lane tools and visualizations

Catalog of lane-related tools found via [AB Street discussion #789](../sources/abstreet-discussion-789.md), [iD #387](https://github.com/openstreetmap/iD/issues/387), OSM Wiki, forum threads, and related GitHub issues. Grouped by maturity.

---

## Active / maintained

### JOSM — Lane and Road Attributes (Map Paint Style)

| Field | Value |
| --- | --- |
| **Status** | Active (v2.10-69, 2025-01-26 per wiki) |
| **URL** | https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes |
| **Author** | Martin Vonwald |
| **Type** | JOSM MapCSS paint style + [Lane Attributes preset](https://josm.openstreetmap.de/wiki/Presets/Lane_Attributes) |

**Tags touched (wiki summary):** `lanes`, `width` / `width:lanes`, `change` / `change:lanes`, `turn` / `turn:lanes`, `cycleway`, `bicycle:lanes`, `bus:lanes`, `psv:lanes`, `placement` (not `transition`), `destination` (+ `destination:ref`, `destination:country`), `lit`, `highway=street_lamp`, `hov:lanes`, `transit` (validates values), `driving_side`, `traffic_sign` (maxspeed/overtaking), `man_made=bridge`, `highway=junction`, enforcement/destination_sign relations, `railway` (limited).

**UX:** Replaces way stroke with lane-accurate cross-section in the map view; detects inconsistent `:lanes` pipe counts and key typos; configurable colors/opacity; left-hand traffic support (nearly untested).

**Known limits:** Max 8 lanes per direction; `turn:lanes` without suffix only on `oneway=yes`; `oneway=-1` issues; width not geographically accurate ([#8588](https://josm.openstreetmap.de/ticket/8588)).

**Editor implication:** De facto standard JOSM lane QA layer; referenced from [Lanes wiki](https://wiki.openstreetmap.org/wiki/Lanes#Editor_support) and [community forum](https://community.openstreetmap.org/t/josm-map-style-lane-and-road-attributes/99251).

**Related:** [Enhanced Lane and Road Attributes](https://josm.openstreetmap.de/wiki/Styles/Enhanced_Lane_and_Road_Attributes) (Florin Badita fork — highlights segment ends, filters by highway class, colors own edits).

---

### JOSM — turnlanes-tagging plugin

| Field | Value |
| --- | --- |
| **Status** | Maintained JOSM plugin |
| **Repo** | https://github.com/JOSM/turnlanes-tagging |
| **Shortcut** | Alt+Shift+2 (Data → Turn lanes tagging editor) |

**Tags touched:** `turn:lanes`, `turn:lanes:forward`, `turn:lanes:backward`, `turn:lanes:both_ways`; auto-updates `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways`.

**UX:** Preset icons for common turn-lane combinations; recent-edits tab; fixes lane count mismatches against `turn:lanes` pipe count. Pairs with **Lane and Road Attributes** style for arrow overlay.

**Editor implication:** Focused turn-lane editor only — does not handle `destination:lanes`, `change:lanes`, `placement`, etc. Criticized as limited in [iD #387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785).

**Sources:** [README](https://github.com/JOSM/turnlanes-tagging), [Mapbox Medium post (2016)](https://medium.com/mapbox/turnlanes-tagging-plugin-for-josm-a93220e9aa0).

---

### osm2streets — Lane editor (AB Street)

| Field | Value |
| --- | --- |
| **Status** | Early experiment (2023+) |
| **Live app** | https://a-b-street.github.io/osm2streets/lane_editor.html |
| **Repo** | https://github.com/a-b-street/osm2streets |
| **Related** | Archived predecessor https://github.com/a-b-street/osm2lanes |

**Tags touched:** Parses OSM way tags into lane specs via Rust `classic.rs` lane logic — broadly `lanes`, `turn:lanes`, `width:lanes`, `placement`, cycleways, sidewalks, etc. (full set in osm2streets lane parser).

**UX:** MapLibre map + cross-section editing; click road to edit; download `.osc` changeset; warns about sidepaths, dual carriageways, clipped ways. **No direct OSM upload yet** ([#216](https://github.com/a-b-street/osm2streets/issues/216)).

**Editor implication:** Mentioned in [iD #387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-156946947) as active lane-editing experiment; planned iD/JOSM plugins listed in [osm2streets README](https://github.com/a-b-street/osm2streets/).

---

### zlant/parking-lanes

| Field | Value |
| --- | --- |
| **Status** | Active viewer/editor (parking-specific) |
| **Live** | https://zlant.github.io/parking-lanes/ |
| **Repo** | https://github.com/zlant/parking-lanes |

**Tags touched:** `parking:lane:*`, `parking:condition:*` (see [Key:parking:lane](https://wiki.openstreetmap.org/wiki/Key:parking:lane)).

**UX:** Visualization mode + edit mode; curb-side color highlighting; parking-only sidebar. Cited in [iD #6178](https://github.com/openstreetmap/iD/issues/6178) as model for dedicated micro-editors.

**Editor implication:** Example of **separate UI per street facet** vs. unified lane editor — [@tordans in #6178](https://github.com/openstreetmap/iD/issues/6178#issuecomment-482986614) argues parking should not be crammed into #387 car-lane UI.

---

## Renderers / navigation consumers (not editors)

### twpol/osm-tiles

| Field | Value |
| --- | --- |
| **Status** | Active overlay service |
| **Live** | https://osm-tiles.james-ross.co.uk/ |
| **Repo** | https://github.com/twpol/osm-tiles |
| **Mentioned in** | [#789 @tordans (Nov 2021)](https://github.com/a-b-street/abstreet/discussions/789) |

**Tags touched:** `lanes` (+ directional), `oneway`, `cycleway` (+ sided/bidirectional), `shoulder`, `parking:lane:*`, `sidewalk`, `verge`, `highway`, `layer`. Fixed default widths; no `width:lanes`, `placement`, `turn:lanes`, bus lanes yet (README TODO).

**UX:** Transparent MVT-style overlay tiles (z16–22) showing lane-level road width; tag test page at `/test.html`.

**Editor implication:** Visualization/QA class tool; @twpol offered to run parser against shared test suite. Full notes: [twpol-osm-tiles.md](./twpol-osm-tiles.md).

---

### BjornRasmussen/Lanes (JOSM plugin)

| Field | Value |
| --- | --- |
| **Status** | Unmaintained since 2022-04; not on official JOSM plugin list |
| **Repo** | https://github.com/BjornRasmussen/Lanes |
| **Mentioned in** | [#789 stakeholder list](https://github.com/a-b-street/abstreet/discussions/789) |

**Tags touched:** `lanes` (+ directional), `*:lanes`, `width` / `width:lanes`, `placement` (+ variants), `lane_markings`, `change:lanes`. Visual map-mode editor with presets.

**UX:** Lane Mapping Mode — click lanes/dividers on map canvas; distinct from turnlanes-tagging and Lane and Road Attributes style.

**Editor implication:** Rare placement-aware structural editor reference. Full notes: [bjornrasmussen-josm-lanes.md](./bjornrasmussen-josm-lanes.md).

---

### Straßenraumkarte Neukölln

| Field | Value |
| --- | --- |
| **Status** | Active showcase project (Berlin Neukölln; style published 2023) |
| **Map** | https://strassenraumkarte.osm-berlin.org/ |
| **Repo** | https://github.com/osmberlin/strassenraumkarte-neukoelln |
| **Wiki** | https://wiki.openstreetmap.org/wiki/Straßenraumkarte_Neukölln |

**Tags touched:** `lanes`, `turn:lanes`, `width:lanes`, `placement`, `lane_markings`, `cycleway:*`, `bicycle:lanes`, `vehicle:lanes`, `lanes:psv`, `dual_carriageway`, `area:highway`+`junction=yes` for complex junctions.

**UX:** QGIS micromap rendering of lane markings, bike lanes, bus lanes — **consumes** tags; documents tagging practices in [blog post](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) (co-authored by @tordans).

**Editor implication:** Shows downstream rendering value of `placement`, `width:lanes`, and explicit bike/bus lane `*:lanes` tags; wiki links [AB Street / osm2lanes](https://wiki.openstreetmap.org/wiki/Straßenraumkarte_Neukölln#See_also) as related lane-spec work.

---

### OsmLaneVisualizer

| Field | Value |
| --- | --- |
| **Status** | Active QA tool |
| **Live** | https://osm.mueschelsoft.de/lanes/render.pl |
| **Legacy** | https://osm.mueschelsoft.de/cgi-bin/render.pl |
| **Repo** | https://github.com/mueschel/OsmLaneVisualizer |
| **Detail** | [osm-lane-visualizer.md](./osm-lane-visualizer.md) |

**Tags touched:** 105+ keys — full `*:lanes` family, `placement`, `width:lanes`, adjacent ways, node highway tags. See project note for interpreted-tag table.

**UX:** HTML **cross-section** schematic (not map overlay). URL-query configuration: `relref`, `start`, `country`, `placement`, `adjacent`, `lanewidth`, `usenodes`.

**QA deep link:** [A 661 with all toggles](https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes) — German Autobahn smoke test for editor QA.

**Editor implication:** De facto cross-section validation reference ([iD #387](https://github.com/openstreetmap/iD/issues/387)); read-only, CC BY-NC-SA.

---

### Map Machine — Road Lanes (Experimental)

| Field | Value |
| --- | --- |
| **Status** | Active; road lanes experimental |
| **Repo** | https://github.com/enzet/map-machine |
| **Detail** | [map-machine.md](./map-machine.md) |
| **Inspiration** | [Navigating the Maze, Part 2](https://blog.imagico.de/navigating-the-maze-part-2/) (Christoph Hormann / imagico) |

**Tags touched:** `highway`, `lanes`, `width`, `width:lanes`, `lanes:forward`, `lanes:backward`, `placement` (+ `transition`), `layer`, `level`, `bridge`/`tunnel`/`ford`/`embankment` (styling), `name` (caption). **Not** `turn:lanes`, `change:lanes`, `destination:lanes`, `bicycle:lanes`, `lane_markings`.

**UX:** Static SVG/PNG map with **map-embedded** road width and lane separator lines (`--roads lanes`). Complements cross-section tools rather than replacing them.

**Editor implication:** Useful map-preview check for `lanes`/`width`/`placement` consistency; no turn-lane or access-lane feedback.

---

### OsmAnd

| Field | Value |
| --- | --- |
| **Status** | Production navigation |
| **Docs** | https://osmand.net/docs/user/widgets/nav-widgets/ (Lanes widget) |

**Tags touched:** Primarily `turn:lanes` (+ `:forward`/`:backward`/`:both_ways`); **not** bare `turn=*` ([issue #12481](https://github.com/osmandapp/OsmAnd/issues/12481)).

**UX:** Lane diagram widget during navigation; highlights recommended lane.

**Editor implication:** Cited in [iD #387 (2016)](https://github.com/openstreetmap/iD/issues/387#issuecomment-220456894) as proof `turn:lanes` data has real-world consumers.

---

### Other consumers (wiki-listed, no dedicated editor)

From [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn):

| Tool | Tags | Role |
| --- | --- | --- |
| Organic Maps | `turn:lanes` | Navigation |
| Magic Earth | `turn:lanes` | Navigation |
| OSM2World | `turn:lanes` | 3D road markings |
| Mapbox Navigation SDK | `turn:lanes` | Turn-by-turn (via OSRM/Valhalla) |

---

## Design references (not OSM tools)

### 3DStreet

| Field | Value |
| --- | --- |
| **URL** | https://3dstreet.app |
| **Repo** | https://github.com/3DStreet/3dstreet |
| **Mentioned in** | [#789 stakeholder @kfarr](https://github.com/a-b-street/abstreet/discussions/789) |

**UX:** Web 3D street scenes from Streetmix segment JSON + built-in templates; OSM/Google 3D Tiles context import for real-world setting.

**Tags touched:** **None natively** — lane model is Streetmix segment types (`drive-lane`, `bike-lane`, `turn-lane`, …), not OSM `:lanes` schema. README lists segment support vs Streetmix.

**Editor implication:** UX/schema adjacent (cross-section editing → 3D); any OSM integration is geospatial context, not tag round-trip.

**Coverage:** shallow — optional follow-up (OSM import path).

---

### Berlin Verkehrswende Radwege (wiki)

| Field | Value |
| --- | --- |
| **URL** | https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele |
| **Mentioned in** | [#789 @tordans, @dabreegster goals](https://github.com/a-b-street/abstreet/discussions/789) |

**Content:** German-community micromapping examples for cycleways (incl. complex `bicycle:lanes`, separation, colouring). Cited as tagging patterns osm2lanes should support.

**Editor implication:** Source of real-world fixture way IDs; pair with [StreetComplete CyclewayParser](./streetcomplete-cycleway-parser.md) tests.

**Coverage:** shallow — optional follow-up (exemplar way IDs → fixtures).

---

### CycleStreets — SOTM 2019 (area:highway)

| Field | Value |
| --- | --- |
| **URL** | https://www.cyclestreets.org/news/2019/09/22/sotm2019/ |
| **Mentioned in** | [#789 @mvl22 (Jan 2022)](https://github.com/a-b-street/abstreet/discussions/789) |

**Topic:** Using area polygons for junction extents to improve routing directions and signal-delay modelling — related to Straßenraumkarte `area:highway` experiment. @tordans (#789): local experiment; needs editor integration before wider push.

**Tags touched:** `area:highway` + junction routing context (not per-lane `:lanes` on ways).

**Coverage:** shallow — optional follow-up.

---

### AB Street osm_viewer & road editor

| Field | Value |
| --- | --- |
| **osm_viewer** | https://a-b-street.github.io/docs/software/osm_viewer.html |
| **Road editor retrospective** | https://a-b-street.github.io/docs/project/retrospective/index.html#road-editor |
| **Mentioned in** | [#789 @dabreegster](https://github.com/a-b-street/abstreet/discussions/789) |

**UX:** osm_viewer — import OSM area, visualize interpreted lanes (coverage limited on web). Road editor — early limited lane-edit UI; successor experiment is [osm2streets lane editor](https://a-b-street.github.io/osm2streets/lane_editor.html).

**Coverage:** shallow — optional follow-up (import pipeline, coverage limits).

---

### Map Machine

| Field | Value |
| --- | --- |
| **Author** | @enzet |
| **Repo** | https://github.com/enzet/map-machine |
| **Mentioned in** | [#789](https://github.com/a-b-street/abstreet/discussions/789) |
| **Detail** | [map-machine.md](./map-machine.md) |

**Tags touched (2021):** Lane count and lane widths only (@enzet). Offered Python/Kotlin implementations of early osm2lanes tests.

**Status:** Lane-tag coverage confirmed — see [map-machine.md](./map-machine.md) (road lanes experimental mode).

---

### Streetmix

| Field | Value |
| --- | --- |
| **URL** | https://streetmix.net/ |
| **Mentioned in** | [iD #387 @1ec5 (2018)](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769); [#789 @tordans](https://github.com/a-b-street/abstreet/discussions/789) |

**UX:** Drag-and-drop street cross-section (sidewalks, bike lanes, parking, transit, trees). Inspiration for sidebar mini-editor, **not** an OSM tag editor.

**Tags touched:** None directly — conceptual UX reference. [@tordans (2019)](https://github.com/openstreetmap/iD/issues/387#issuecomment-484789342) lists desired facets (sidewalks, parking, tram, kerbs, bollards). In [#789](https://github.com/a-b-street/abstreet/discussions/789), @tordans prioritizes a Streetmix-like tool that **outputs OSM tagging recommendations**; @dabreegster links iD #387 and AB Street road editor as partial starts.

**Coverage:** shallow — optional follow-up (data model vs `:lanes`; no OSM export).

---

### StreetPlan

| Field | Value |
| --- | --- |
| **URL** | http://streetplan.net/ |
| **Mentioned in** | [iD #387 @1ec5 (2018)](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769) |

**UX:** Similar cross-section street design tool; cited alongside Streetmix.

---

### bhousel CodePen mockup

| Field | Value |
| --- | --- |
| **URL** | https://codepen.io/bhousel/pen/jrVoNm |
| **Mentioned in** | [iD #387 @1ec5 (2018)](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769) |

**UX:** SVG cross-section lane editor mockup in the OsmLaneVisualizer direction.

---

## Historical / abandoned / limited

### iD PR #3822 — Lanes (kepta, 2017)

| Field | Value |
| --- | --- |
| **Status** | Closed 2020; never merged |
| **PR** | https://github.com/openstreetmap/iD/pull/3822 |
| **Tags** | `turn:lanes`, `lanes`, directional variants; map-overlay lane icons |

**UX:** Floating turn-lane icons on map at way endpoints; GIF demos in PR and [#387](https://github.com/openstreetmap/iD/issues/387#issuecomment-277539927). [@bhousel (2018)](https://github.com/openstreetmap/iD/pull/3822#issuecomment-404321234): stale, confusing UI, “start over”; [@1ec5 (2021)](https://github.com/openstreetmap/iD/pull/3822#issuecomment-1001556786): closed because design moved to inspector/cross-section.

---

### osm2lanes (archived)

| Field | Value |
| --- | --- |
| **Status** | Archived; superseded by osm2streets |
| **Repo** | https://github.com/a-b-street/osm2lanes |
| **Demo** | https://a-b-street.github.io/osm2lanes/ |

**Tags:** OSM tags → lane specifications (Rust library + web demo). [Issue #240](https://github.com/a-b-street/osm2lanes/issues/240) prototyped web lane editor with OSC export.

---

### JOSM `lane_features` style

See [josm-lane-features.md](./josm-lane-features.md). Older MapCSS style; largely superseded by Lane and Road Attributes.

---

### JOSM built-in Turn Lanes plugin (core)

| Field | Value |
| --- | --- |
| **Evidence** | [JOSM source TurnLanesDialog](https://josm.openstreetmap.de/browser/osm/applications/editors/josm/plugins/turnlanes/src/org/openstreetmap/josm/plugins/turnlanes/gui/TurnLanesDialog.java) |
| **Tags** | Turn relations, lane lengths (separate from `turn:lanes` tagging plugin) |

**Status:** Referenced in [forum thread](https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033) as “JOSM lane editor” alongside validator — relationship to `turnlanes-tagging` plugin unclear from public docs.

---

### StreetComplete

| Field | Value |
| --- | --- |
| **URL** | https://streetcomplete.app/ |
| **Mentioned in** | [#789 @westnordost](https://github.com/a-b-street/abstreet/discussions/789); [community forum](https://community.openstreetmap.org/t/josm-plugin-available/136910) |

**Tags:** App quests use partial tags (`lanes` count, cycleway survey). **CyclewayParser** (separate module) parses extensive `cycleway:*` combinations — see [streetcomplete-cycleway-parser.md](./streetcomplete-cycleway-parser.md). Not a holistic lane editor per @westnordost (#789).

---

## Needs confirmation

| Name | What we found | Open question |
| --- | --- | --- |
| **quincylvania iD lane mockups (2018–2019)** | Screenshots in [#387](https://github.com/openstreetmap/iD/issues/387#issuecomment-447620208); no public repo linked | Is any prototype code open-sourced? [@hungerburg (2021)](https://github.com/openstreetmap/iD/issues/387#issuecomment-782456789) asked; no answer with repo URL. |
| **kepta GSoC proposal (2016)** | Google Doc linked in [#387](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634): https://docs.google.com/document/d/1HOM4TCKk2Bvw0tiRHQEh8B7gGrZqrQxBO0vH1bJidHw | Document not fetched; may contain additional tool references. |
| **JOSM core Turn Lanes vs turnlanes-tagging** | Two different codebases in JOSM ecosystem | Which plugin [#387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785) criticizes? |
| **“Several tools for editing lanes” (forum)** | [Forum post](https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033) mentions multiple tools, one “outdated / failed proposal” | Exact list not enumerated in search snippet — needs manual thread read. |
| **OsmLaneVisualizer `parking:lane` support** | [Quality assurance wiki](https://wiki.openstreetmap.org/wiki/Quality_assurance) note (Dec 2022): tool uses deprecated `parking:lane` schema | Whether current repo still does — not verified against latest code. |

---

## Forum threads (lane editors / visualization)

| URL | Topic |
| --- | --- |
| https://community.openstreetmap.org/t/consensus-regarding-lane-and-turn-lane-tagging-guidelines/133364 | Turn:lanes tagging policy (Lyft team; physical markings vs maneuvers) |
| https://community.openstreetmap.org/t/how-to-use-turn-lanes-in-osm-to-find-lane-connectivity-on-intersection/9260 | `turn:lanes` vs connectivity relations |
| https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033 | Lane count semantics; JOSM lane editor mentions |
| https://community.openstreetmap.org/t/josm-map-style-lane-and-road-attributes/99251 | Lane and Road Attributes style behavior / defaults |
| https://community.openstreetmap.org/t/josm-plugin-available/136910 | Pointers to Lane and Road Attributes + StreetComplete |

No dedicated forum thread titled “OsmLaneVisualizer” was found in search; tool is documented on [OSM Wiki](https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer) and referenced from GitHub.

---

## Wiki pages (lane visualization / tagging)

| Page | URL | Relevance |
| --- | --- | --- |
| Lanes | https://wiki.openstreetmap.org/wiki/Lanes | Central `*:lanes` documentation; JOSM editor support section |
| Key:*:lanes | https://wiki.openstreetmap.org/wiki/Key:*:lanes | Approved suffix spec |
| Key:turn | https://wiki.openstreetmap.org/wiki/Key:turn | `turn:lanes`; lists consumers + OsmLaneVisualizer |
| Key:placement | https://wiki.openstreetmap.org/wiki/Key:placement | De facto placement key |
| Proposal:Placement | https://wiki.openstreetmap.org/wiki/Proposal:Placement | Original placement proposal |
| Relation:connectivity | https://wiki.openstreetmap.org/wiki/Relation:connectivity | Lane connectivity between ways |
| Proposal:Transit | https://wiki.openstreetmap.org/wiki/Proposal:Transit | Alternative connectivity (`transit=*`) — discussed in #387 |
| OSM Lane Visualizer | https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer | Tool entry |
| Quality assurance | https://wiki.openstreetmap.org/wiki/Quality_assurance | Lists lane QA tools |

---

## Sources

- https://github.com/a-b-street/abstreet/discussions/789
- https://github.com/twpol/osm-tiles
- https://github.com/BjornRasmussen/Lanes
- https://github.com/3DStreet/3dstreet
- https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege
- https://www.cyclestreets.org/news/2019/09/22/sotm2019/
- https://github.com/openstreetmap/iD/issues/387
- https://github.com/openstreetmap/iD/issues/6178
- https://github.com/openstreetmap/iD/pull/3822
- https://github.com/a-b-street/osm2streets/issues/216
- https://wiki.openstreetmap.org/wiki/Lanes
- https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes
- https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update
- https://github.com/enzet/map-machine
- https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes
