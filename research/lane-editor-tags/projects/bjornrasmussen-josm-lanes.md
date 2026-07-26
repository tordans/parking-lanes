# BjornRasmussen/Lanes — JOSM visual lane editor plugin

Stakeholder in [AB Street discussion #789](../sources/abstreet-discussion-789.md). **Fetched 2026-07-25.**

| Field | Value |
|-------|-------|
| **Repo** | https://github.com/BjornRasmussen/Lanes |
| **Description** | “Visual OpenStreetMap Lane Editor Plugin for JOSM” |
| **Author** | Leif Rasmussen (@BjornRasmussen) |
| **Language** | Java |
| **Created** | 2020-11-09 |
| **Last push** | 2022-04-27 |
| **Stars** | 9 |
| **JOSM plugin list** | **Not found** in official [JOSM Plugins](https://josm.openstreetmap.de/wiki/Plugins) wiki (needs user confirmation whether ever published) |

---

## Status: likely unmaintained / experimental

- No commits since April 2022; no releases.
- README is minimal (architecture notes only); `README.template` is generic JOSM plugin scaffold.
- GitHub issues: manifest/version problems fixed 2022-04; open issues #2 (country-specific line colours), #7 (view-only mode) stale since 2020–2021.
- **Not** the same as:
  - [JOSM turnlanes-tagging](https://github.com/JOSM/turnlanes-tagging) — turn-lane presets only
  - [Lane and Road Attributes](https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes) MapCSS style — paint/QA, not structural editor
  - JOSM core Turn Lanes plugin — turn relations

---

## Architecture

From `ARCHITECTURE` + `README`:

1. `LanesPlugin` boots with JOSM.
2. `LaneMappingMode` — custom map mode; fetches ways, builds `RoadRenderer` per way + `IntersectionRenderer` at nodes.
3. `RoadRendererMarked` — parses tags into forward/backward/both-ways lanes + dividers; applies `placement` offsets; paints asphalt polygons on map.
4. `RoadPieceLane`, `RoadPieceDivider`, `RoadPieceEdge` — clickable cross-section pieces with popups.
5. `UtilsPresets` — icon presets for common lane layouts (US/CA centre-turn variants).

---

## Tags touched (from source)

| Category | Tags |
|----------|------|
| Lane counts | `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways` |
| Per-lane | Any `*:lanes`, `*:lanes:forward`, `*:lanes:backward`, `*:lanes:both_ways` (pipe expansion on edit) |
| Width | `width`, `width:start`, `width:end`, `est_width` (+ `:start`/`:end`); `width:lanes:*` per lane when present |
| Placement | `placement`, `placement:forward/backward/both_ways`, `:start`/`:end` variants |
| Markings | `lane_markings` (yes/no); unmarked roads use `width` or `narrow=yes` |
| Change | `change:lanes`, `change:lanes:forward`, `change:lanes:backward` (auto-maintained) |
| Oneway | `oneway` — **`oneway=-1` explicitly unsupported** (`_isValid = false`) |

**Not evident in core renderer:** `cycleway:*`, `parking:lane:*`, `turn:lanes` geometry (turn arrows may appear via `*:lanes` values), bus lanes as first-class UI.

---

## UX

- Enters **Lane Mapping Mode** — replaces way stroke with geographically offset lane polygons.
- Click lane/divider → popup to edit count, widths, `:lanes` pipe strings, presets.
- Presets: one-way (1–4 lanes), two-way symmetric (1+1 … 3+3), unmarked (`lanes:both_ways` or fractional width), US centre-turn layouts (`mt111y`, `mt212y`).
- Intersection rendering at nodes (experimental; issue #8 RFC on diverging lanes).
- Invalid tagging → red error styling.

---

## Editor implications

- Closest #789-era **structural lane editor** besides osm2lanes web demo.
- **Placement-aware** editing (rarer in other tools) — useful reference for our placement UX.
- Pipe-count sync when changing lane counts (`UtilsPresets.setLanesInDirection`) — pattern to reuse.
- Abandoned state means behaviour is frozen ~2022 JOSM API; do not depend on installability without fork.

---

## Distinction from other JOSM lane tools

| Tool | Edits geometry in map? | Full cross-section? | turn:lanes focus |
|------|------------------------|---------------------|------------------|
| **BjornRasmussen/Lanes** | Yes (lane polygons) | Yes (carriageway lanes + placement) | Via generic `*:lanes` |
| turnlanes-tagging | No (tags only) | No | Yes |
| Lane and Road Attributes | No (style only) | Visualize | Validates `turn:lanes` |
| Lane Attributes preset | Inspector | Partial | Partial |

---

## Open questions

1. Was this ever distributed via JOSM plugin manager? (needs user confirmation)
2. Any production users / fork maintenance?
3. Full list of supported `*:lanes` keys in dividers (access, turn, bus) — needs deeper `RoadPieceDivider` read.

---

## Sources

- https://github.com/BjornRasmussen/Lanes
- https://github.com/BjornRasmussen/Lanes/blob/master/ARCHITECTURE
- https://github.com/BjornRasmussen/Lanes/blob/master/src/org/openstreetmap/josm/plugins/lanes/RoadRendererMarked.java
- https://github.com/BjornRasmussen/Lanes/blob/master/src/org/openstreetmap/josm/plugins/lanes/UtilsPresets.java
- https://github.com/a-b-street/abstreet/discussions/789
