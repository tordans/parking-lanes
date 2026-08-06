# Sources and method

Research for lane-editor tag documentation. Fetched or read **2026-07-25**. Wiki pages may have changed since.

## Primary historical source

| Source | Summary |
|--------|---------|
| [AB Street discussion #789 (Oct 2021)](https://github.com/a-b-street/abstreet/discussions/789) | Origin of shared **OSM tags → lane specification** idea; stakeholders, API sketch, single-way vs multi-way debate, provenance/`source` on defaults, round-trip editing, test-suite-first approach → [osm2lanes](https://github.com/a-b-street/osm2lanes). Full notes: [sources/abstreet-discussion-789.md](./sources/abstreet-discussion-789.md). |

## OSM Wiki (English)

| Source | Summary |
|--------|---------|
| [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | De-facto definition of `lanes=*` count for motorised traffic; includes/excludes bike lanes, bus lanes, shoulders; forward/backward/both_ways extensions. |
| [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | Master page for `*:lanes` suffix schema; pipe-separated per-lane values; access vs attribute tags; mapping split rules at lane transitions. |
| [Key:turn:lanes](https://wiki.openstreetmap.org/wiki/Key:turn) (redirect from Key:turn:lanes) | Indicated turn directions per lane; values, combinations, vehicle-specific variants; connectivity relation for complex junctions. |
| [Key:placement](https://wiki.openstreetmap.org/wiki/Key:placement) | Short key page; points to placement proposal for geometry offset of OSM way vs road cross-section. |
| [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | Full placement model: `middle_of:N`, `right_of:N`, `left_of:N`, `transition`, `:start`/`:end`; motorway exit examples. |
| [Key:change](https://wiki.openstreetmap.org/wiki/Key:change) | Lane-change restrictions via `change:lanes`; values `yes`, `no`, `not_left`, `not_right`; relation to turn lanes and overtaking. |
| [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings) | `lane_markings=yes|no` for painted/virtual lane delineation; alternative to invalid `lanes=0` etc. |
| [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | **Approved** (2025-07-10) separate geometries for markings not derivable from centreline; junction arrows, stop lines, gores. Full notes: [tags/road-marking.md](./tags/road-marking.md). |
| [Proposal:Road_marking_revision](https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision) | Approved proposal restructuring `road_marking=*` values and styling subtags (`stroke`, `pattern`, `arrow`, …). |
| [Key:access](https://wiki.openstreetmap.org/wiki/Key:access) (redirect from Key:access:lanes) | Access hierarchy; `access:lanes` uses same values per lane; `variable` and `escape` lane-specific values. |
| [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) (includes width:lanes) | Carriageway width; `width:lanes` per-lane widths; fuzziness of street width semantics. **Deep dive:** [../width-measurements/](../width-measurements/), sources [../width-measurements/sources.md](../width-measurements/sources.md). |
| [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | Two schemes: `lanes:psv`/`lanes:bus` vs `psv:lanes`/`bus:lanes`; counting; conditional bus lanes; contraflow. |
| [Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking) | Centre-line overtaking restrictions; regional defaults; overlap with `change:lanes`. |
| [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | Draft `separation` / `marking` / `traffic_mode` schema for protected bike lanes, lane edges, and road dividers. Berlin practice since 2019; full notes: [tags/separation-proposal.md](./tags/separation-proposal.md). Old URL `Proposed_features/cycleway:separation` serves same page. |
| [JOSM lane_features style](https://wiki.openstreetmap.org/wiki/Josm/styles/lane_features) | JOSM interpretation of lanes, turn:lanes, access:lanes, change:lanes, cycleway, sidewalk. See [projects/josm-lane-features.md](./projects/josm-lane-features.md). |
| [Key:*:lanes](https://wiki.openstreetmap.org/wiki/Key:*:lanes) | Approved `:lanes` suffix spec. |
| [Relation:connectivity](https://wiki.openstreetmap.org/wiki/Relation:connectivity) | Lane connectivity between ways. |
| [Proposal:Transit](https://wiki.openstreetmap.org/wiki/Proposal:Transit) | Alternative connectivity (`transit=*`) — discussed in iD #387. |
| [OSM Lane Visualizer](https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer) | Tool wiki entry; see [projects/osm-lane-visualizer.md](./projects/osm-lane-visualizer.md). |
| [Quality assurance](https://wiki.openstreetmap.org/wiki/Quality_assurance) | Lists lane QA tools. |

## OSM Wiki (German)

| Source | Summary |
|--------|---------|
| [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | German lanes count; explicitly excludes bike/parking/shoulder lanes; mentions `placement` in related tags. |
| [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | German `:lanes` suffix guide; critical note that `lanes` count ≠ `:lanes` pipe count when bike lanes on carriageway. |
| [DE:Key:width](https://wiki.openstreetmap.org/wiki/DE:Key:width) | Units / `est_width` / `maxwidth` vs `maxwidth:physical`; no full EN “Width of streets” section. |
| [DE:Key:placement](https://wiki.openstreetmap.org/wiki/DE:Key:placement) | Stub; refers to placement proposal. |
| [DE:Key:turn:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes) | German turn:lanes values and bidirectional tagging examples. |
| [Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege) | Cycle `width` between boundary lines; numeric `buffer` practice; tagging examples. Width deep dive: [../width-measurements/](../width-measurements/). |

## Projects and tools

| Source | Summary |
|--------|---------|
| [AB Street discussion #789](https://github.com/a-b-street/abstreet/discussions/789) | Shared lane-spec library proposal; links StreetComplete CyclewayParser, shared-row, twpol/osm-tiles, BjornRasmussen/Lanes, Berlin Radwege, CycleStreets area:highway. |
| [twpol/osm-tiles](https://github.com/twpol/osm-tiles) | C# overlay tiles drawing lane-level road cross-section from OSM tags; cited in #789. See [projects/_twpol-osm-tiles.md](./projects/_twpol-osm-tiles.md). |
| [BjornRasmussen/Lanes](https://github.com/BjornRasmussen/Lanes) | JOSM visual lane editor plugin; #789 stakeholder. See [projects/bjornrasmussen-josm-lanes.md](./projects/bjornrasmussen-josm-lanes.md). |
| [d-wasserman/shared-row Slice spec](https://github.com/d-wasserman/shared-row/blob/main/specification/MarkdownTables/Slice.md) | ROW slice vocabulary (not OSM parser). See [projects/_shared-row.md](./projects/_shared-row.md). |
| [StreetComplete CyclewayParser](https://github.com/streetcomplete/StreetComplete/tree/master/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway) | Exhaustive cycleway tag parser + tests; #789 reference. See [projects/_streetcomplete-cycleway-parser.md](./projects/_streetcomplete-cycleway-parser.md). |
| [Straßenraumkarte micromap update (2021)](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) | Berlin Neukölln experimental renderer; uses placement, width:lanes, bicycle:lanes, lane_markings, change, area:highway junction cutouts. |
| [OsmLaneVisualizer README](https://github.com/mueschel/OsmLaneVisualizer) | 105+ lane-related keys interpreted for HTML QA visualization; placement experimental support. Live: [`/lanes/render.pl`](https://osm.mueschelsoft.de/lanes/render.pl); legacy [`/cgi-bin/render.pl`](https://osm.mueschelsoft.de/cgi-bin/render.pl). [A 661 QA deep link](https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes). |
| [k-yle/osm-lane-parser](https://github.com/k-yle/osm-lane-parser) + [kyle.kiwi/iD Lane Editor](https://kyle.kiwi/iD) | JS lane parser (`osm-lanes`) + React sidebar plugin in Kyle’s iD fork (read-only viz). See [projects/kyle-kiwi-id-lanes.md](./projects/kyle-kiwi-id-lanes.md). |
| [Map Machine README](https://github.com/enzet/map-machine) | Python SVG/PNG renderer; experimental `--roads lanes` mode — width from `width` or `lanes`, lane separators; inspired by [Navigating the Maze](https://blog.imagico.de/navigating-the-maze-part-2/). |
| [osm2lanes README](https://github.com/a-b-street/osm2lanes) | Archived; lane parsing moved to osm2streets; defines lane as continuous area; separator assumptions. |
| [osm2streets README](https://github.com/a-b-street/osm2streets) | Active lane-level street model; StreetExplorer, lane editor; classic lane parsing in Rust. |
| [JOSM Lane and Road Attributes style](https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes) | Active MapCSS lane QA; see [projects/josm-lane-and-road-attributes.md](./projects/josm-lane-and-road-attributes.md). |
| [JOSM turnlanes-tagging](https://github.com/JOSM/turnlanes-tagging) | Maintained `turn:lanes` editor plugin. See [projects/josm-turnlanes-tagging.md](./projects/josm-turnlanes-tagging.md). |
| [Proposal:Turn lanes (relation)](https://wiki.openstreetmap.org/wiki/Proposal:Turn_lanes_(relation)) + [tsmock/turnlanes](https://github.com/tsmock/turnlanes) | Obsolete relation schema; JOSM junction GUI with offset/fillet rendering. See [projects/josm-turnlanes-core.md](./projects/josm-turnlanes-core.md), [../lane-rendering/josm-turnlanes-renderer.md](../lane-rendering/josm-turnlanes-renderer.md). |
| [zlant/parking-lanes](https://github.com/zlant/parking-lanes) | Parking micro-editor; separate-facet UX precedent. See [projects/_zlant-parking-lanes.md](./projects/_zlant-parking-lanes.md). |
| [OsmAnd Lanes widget](https://osmand.net/docs/user/widgets/nav-widgets/) | Production `turn:lanes` consumer. See [projects/_osmand.md](./projects/_osmand.md). |
| [Streetmix](https://streetmix.net/) | Cross-section UX design reference (no OSM export). See [projects/_streetmix.md](./projects/_streetmix.md). |
| [3DStreet](https://github.com/3DStreet/3dstreet) | 3D street viz from Streetmix segments. See [projects/_3dstreet.md](./projects/_3dstreet.md). |
| [OSM Lane Visualizer wiki](https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer) | Tool entry; detail in [projects/osm-lane-visualizer.md](./projects/osm-lane-visualizer.md). |
| [Quality assurance wiki](https://wiki.openstreetmap.org/wiki/Quality_assurance) | Lists lane QA tools; notes OsmLaneVisualizer `parking:lane` usage (needs re-check). |

## Forum threads (lane editors / visualization)

| URL | Topic |
| --- | --- |
| https://community.openstreetmap.org/t/consensus-regarding-lane-and-turn-lane-tagging-guidelines/133364 | Turn:lanes tagging policy (Lyft team; physical markings vs maneuvers) |
| https://community.openstreetmap.org/t/how-to-use-turn-lanes-in-osm-to-find-lane-connectivity-on-intersection/9260 | `turn:lanes` vs connectivity relations |
| https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033 | Lane count semantics; JOSM lane editor mentions |
| https://community.openstreetmap.org/t/josm-map-style-lane-and-road-attributes/99251 | Lane and Road Attributes style behavior / defaults |
| https://community.openstreetmap.org/t/josm-plugin-available/136910 | Pointers to Lane and Road Attributes + StreetComplete |

## Method

1. Prefer **wiki EN** as primary normative source; use **wiki DE** where it clarifies local practice (especially counting and Fahrradstreifen).
2. Cross-check **consumer behaviour** (Straßenraumkarte, osm2streets, OsmLaneVisualizer, Map Machine, JOSM) for editor/rendering requirements.
3. Mark **needs verification** where wiki is ambiguous, proposals are draft, or projects use experimental tags.
4. **Access vs physical**: access/mode tags describe who may use a lane; physical tags describe infrastructure geometry and markings. Both use the same `:lanes` pipe schema but answer different questions.
5. Consolidated table in `tags/consolidated-tag-reference.md` merges tags from all sources above; priority reflects lane-editor needs, not general OSM importance.

## Known wiki gaps (at time of research)

- `placement=*` key page is minimal; full semantics only in draft proposal.
- `separation` / `marking` / `traffic_mode` still draft ([Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation)); covered in [tags/separation-proposal.md](./tags/separation-proposal.md). Berlin DE page: [Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege).
- `surface:colour` per lane: used by Straßenraumkarte for cycleways; no dedicated EN wiki key page found — may be `surface:colour` on cycleway or `colour=*` variants.
- `lanes:both` vs `lanes:both_ways`: both appear in the wild; wiki documents `lanes:both_ways` (proposal for `:both_ways` suffix).
- Junction lane connectivity: `connectivity` relation documented but underused; no settled junction-area lane drawing standard. Approved `road_marking=*` (2025) offers separate-geometry junction markings — see [tags/road-marking.md](./tags/road-marking.md).
- [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings) See also may still describe `road_marking` as experimental; canonical status is **approved** on [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking).
- Whether bike lanes count in `lanes=*`: wiki says exclude, with explicit NOTE that this is not fully settled (2023 discourse).
- Whether motor `width:lanes` includes painted line millimetres: **not documented**; Berlin numeric `cycleway:*:buffer` **does** include markings — see [../width-measurements/](../width-measurements/).
- No single tag for full street ROW (carriageway + both sidewalks + planted median).
