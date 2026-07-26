# Map Machine — Road Lanes (Experimental)

Research note on [Map Machine](https://github.com/enzet/map-machine) **Road Lanes** rendering — a map-embedded lane visualizer, not an editor.

## Overview

| Field | Value |
| --- | --- |
| **Name** | Map Machine |
| **Author** | Sergey Vartanov (enzet) |
| **License** | MIT (code); Röntgen icons [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| **Repo** | https://github.com/enzet/map-machine |
| **Stack** | Python 3.10+, Cairo/GEOS, SVG/PNG output, Röntgen 14×14 px icon set |
| **Status** | Active; Road Lanes marked **experimental** in README |
| **Type** | Static map renderer (SVG/PNG tiles); experimental tag playground |

Map Machine is a Python OpenStreetMap renderer that produces **static SVG maps** (and PNG slippy tiles). Unlike standard cartographic styles, it aims to visualize **any** OSM tag — including rare, proposed, or deprecated ones — via icons, colours, and experimental geometry modes.

The **Road Lanes** feature (`--roads lanes`) draws roads at **real-world width** on the map canvas and adds **lane separator lines** when `lanes=*` is present. It is inspired by Christoph Hormann (imagico)’s [Navigating the Maze, Part 2](https://blog.imagico.de/navigating-the-maze-part-2/).

CLI modes (`--roads <mode>`): `no` | `simple` | `lanes` (default in scheme is `lanes` per [`map_configuration.py`](https://github.com/enzet/map-machine/blob/main/map_machine/map_configuration.py)).

Example from README:

```shell
map-machine render -c 47.61224,-122.33866 -s 600,400
```

## Road Lanes feature

| Aspect | Behaviour |
| --- | --- |
| **Activation** | `--roads lanes` (or scheme default) |
| **Width** | `width=*` tag if present; else `lanes` × 3.7 m (`DEFAULT_LANE_WIDTH` in code) |
| **Fallback width** | Per-`highway` `default_width` from [`scheme/roads.yml`](https://github.com/enzet/map-machine/blob/main/map_machine/scheme/roads.yml) when no `lanes`/`width` |
| **Lane separators** | Drawn when `lanes` ≥ 2 — evenly spaced dashed lines inside road fill |
| **Placement** | Offsets road centreline via `placement=*` (`left_of`, `middle_of`, `right_of`, `transition`) |
| **Per-lane width** | `width:lanes` pipe list applied when count matches `lanes` |
| **Direction hints** | `lanes:forward` / `lanes:backward` mark lane objects (not drawn as arrows) |
| **Inspiration** | [Navigating the Maze, Part 2](https://blog.imagico.de/navigating-the-maze-part-2/) — Hormann’s lane-width cartography essay |

Rendering path: `Constructor` builds `Road` objects for ways matching `roads.yml` → `Map.draw()` calls `Roads.draw_lanes()` when `road_mode == LANES` ([`mapper.py`](https://github.com/enzet/map-machine/blob/main/map_machine/mapper.py)).

## Tags used for road lanes

Evidence from [`map_machine/feature/road.py`](https://github.com/enzet/map-machine/blob/main/map_machine/feature/road.py), [`scheme/roads.yml`](https://github.com/enzet/map-machine/blob/main/map_machine/scheme/roads.yml), and [`tests/test_road.py`](https://github.com/enzet/map-machine/blob/main/tests/test_road.py). **Do not assume tags below are rendered visually** — many only affect width/offset/styling.

| Tag | Role | How used | Source path |
| --- | --- | --- | --- |
| `highway=*` | Road class | Matches `roads.yml` entries; sets default width, colour, border, draw priority | `scheme/roads.yml`, `constructor.py` |
| `service=parking_aisle` | Exception | Narrower default width for parking aisles | `scheme/roads.yml` |
| `lanes` | Lane count + width | `int(lanes) × 3.7` m width; creates lane list; enables separator drawing | `feature/road.py` |
| `width` | Carriageway width | Overrides lane-derived width (metres) | `feature/road.py` |
| `width:lanes` | Per-lane width | Pipe-separated floats; applied per lane when count matches `lanes` | `feature/road.py` |
| `lanes:forward` | Direction | Marks last N lanes as forward (`is_forward=True`) | `feature/road.py` |
| `lanes:backward` | Direction | Marks first N lanes as backward (`is_forward=False`) | `feature/road.py` |
| `placement` | Geometry offset | `left_of:N`, `middle_of:N`, `right_of:N` shift centreline; `transition` defers to connector logic | `feature/road.py` |
| `layer` | Z-order | Sort key with `level` and road priority | `feature/road.py`, `Roads.draw_lanes()` |
| `level` | Floor filter | Minimum level value; overground default hides underground | `feature/road.py`, `map_configuration.py` |
| `bridge=yes` | Styling | Wider border stroke; bridge border colour | `feature/road.py` |
| `tunnel=yes` | Styling | Lighter fill; dashed border | `feature/road.py` |
| `ford=yes` | Styling | Ford border colour; extra border width | `feature/road.py` |
| `embankment=yes` | Styling | Embankment border colour; dashed border | `feature/road.py` |
| `name` | Label | Road name along path when captions enabled | `feature/road.py` `draw_caption()` |

### Tags with dataclass placeholders but **not** read from OSM

The `Lane` dataclass defines `turn`, `change`, and `destination` fields ([`road.py` lines 49–51](https://github.com/enzet/map-machine/blob/main/map_machine/feature/road.py)) but **`Road.__init__` never populates them** from `turn:lanes`, `change:lanes`, or `destination:lanes`. No references to those keys exist in the road module.

## What it does NOT do

Compared to OsmLaneVisualizer, Straßenraumkarte, and osm2streets — based on source review, not README claims:

| Capability | Map Machine | OsmLaneVisualizer | Straßenraumkarte | osm2streets |
| --- | --- | --- | --- | --- |
| Cross-section schematic | No | **Yes** (primary UX) | Partial (micromap) | **Yes** (lane editor) |
| Map-embedded lane geometry | **Yes** | No | **Yes** | **Yes** |
| `turn:lanes` arrows | **No** | **Yes** | **Yes** | **Yes** |
| `destination:lanes` signs | **No** | **Yes** | **Yes** | Partial |
| `change:lanes` markings | **No** | **Yes** | **Yes** | **Yes** |
| `bicycle:lanes` / `bus:lanes` | **No** | **Yes** | **Yes** | **Yes** |
| `lane_markings` | **No** | Partial | **Yes** | **Yes** |
| `placement:forward`/`:backward` | **No** (bare `placement` only) | **Yes** | **Yes** | **Yes** |
| Adjacent-way context | **No** | Optional toggle | Via separate features | Via sidepaths |
| Lane connectivity / junction areas | Basic connectors only | Chain-based cross-section | `area:highway` junctions | **Yes** |
| Edit / OSC export | **No** | **No** | **No** | **Yes** (experimental) |

Lane separators are **geometric dividers** (equal spacing inside total width), not turn arrows or access-coloured slots.

## UX implications for a lane editor

1. **Complementary view type:** Map Machine validates how `lanes` + `width` look **on the map**; OsmLaneVisualizer validates the **cross-section tag model**. An editor could offer both: schematic sidebar + map preview overlay.
2. **Width feedback loop:** Editors should keep `width` consistent with `lanes` × default lane width (3.7 m here) or explicit `width:lanes` — Map Machine exposes mismatches as visibly wrong road thickness.
3. **Placement is geometry, not metadata:** `placement=*` shifts the drawn polyline — editors need placement pickers tied to way offset, similar to osm2streets/Straßenraumkarte.
4. **No turn-lane UX parity:** Map Machine will not surface tagging errors in `turn:lanes` pipe counts; cross-section QA tools remain necessary.
5. **Experimental status:** Road Lanes mode may change; not suitable as sole production QA reference without pinning a Map Machine version.

## Tests / fixtures worth adopting

From [`tests/test_road.py`](https://github.com/enzet/map-machine/blob/main/tests/test_road.py) — minimal synthetic ways, good unit-test patterns:

| Test case | Tags | Asserts |
| --- | --- | --- |
| Lane count → width | `lanes=4` | 4 lanes, width = 4 × 3.7 |
| Explicit width | `width=10.5` | width = 10.5 |
| Placement offset | `lanes=3`, `placement=right_of:1` | `placement_offset != 0` |
| Per-lane widths | `lanes=2`, `width:lanes=3.5\|4.0` | lane widths 3.5 and 4.0 |
| Forward lanes | `lanes=4`, `lanes:forward=2` | last 2 lanes `is_forward` |
| Backward lanes | `lanes=4`, `lanes:backward=2` | first 2 lanes not forward |
| Bridge / tunnel / ford / embankment | `bridge`, `tunnel`, `ford`, `embankment` | border/fill style differences |

General OSM fixtures in `tests/data/*.osm` are bounding-box samples, not lane-specific.

README visual regression asset: [`doc/lanes.svg`](https://github.com/enzet/map-machine/blob/main/doc/lanes.svg) (Seattle example coordinates).

## Source index

- https://github.com/enzet/map-machine
- https://raw.githubusercontent.com/enzet/map-machine/main/README.md (Road Lanes section)
- https://github.com/enzet/map-machine/blob/main/map_machine/feature/road.py
- https://github.com/enzet/map-machine/blob/main/map_machine/scheme/roads.yml
- https://github.com/enzet/map-machine/blob/main/map_machine/mapper.py
- https://github.com/enzet/map-machine/blob/main/map_machine/map_configuration.py
- https://github.com/enzet/map-machine/blob/main/map_machine/constructor.py
- https://github.com/enzet/map-machine/blob/main/tests/test_road.py
- https://blog.imagico.de/navigating-the-maze-part-2/

## Open questions

- Are `lanes:forward` / `lanes:backward` intended for future asymmetric separator styling, or only internal bookkeeping? Currently not rendered differently.
- Will `turn:lanes`, `change:lanes`, or `destination:lanes` be wired to the existing `Lane` dataclass fields?
- Does `placement:forward` / `placement:backward` appear in real data that Map Machine should support?
- Is the 3.7 m default lane width configurable per country (DE often uses 3.5 m, US ~3.0 m)?
- Road Lanes default is on in scheme — is that stable for general Map Machine users, or should `simple` be default?
