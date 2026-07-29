# JOSM — Lane and Road Attributes (Map Paint Style)

Research note on the actively maintained JOSM MapCSS style for lane QA visualization.

## Overview

| Field | Value |
| --- | --- |
| **Status** | Active (v2.10-69, 2025-01-26 per wiki) |
| **URL** | https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes |
| **Author** | Martin Vonwald |
| **Type** | JOSM MapCSS paint style + [Lane Attributes preset](https://josm.openstreetmap.de/wiki/Presets/Lane_Attributes) |

**Related:** [Enhanced Lane and Road Attributes](https://josm.openstreetmap.de/wiki/Styles/Enhanced_Lane_and_Road_Attributes) (Florin Badita fork — highlights segment ends, filters by highway class, colors own edits). Older parallel style: [josm-lane-features.md](./josm-lane-features.md).

## Tags touched (wiki summary)

`lanes`, `width` / `width:lanes`, `change` / `change:lanes`, `turn` / `turn:lanes`, `cycleway`, `bicycle:lanes`, `bus:lanes`, `psv:lanes`, `placement` (not `transition`), `destination` (+ `destination:ref`, `destination:country`), `lit`, `highway=street_lamp`, `hov:lanes`, `transit` (validates values), `driving_side`, `traffic_sign` (maxspeed/overtaking), `man_made=bridge`, `highway=junction`, enforcement/destination_sign relations, `railway` (limited).

## UX

Replaces way stroke with lane-accurate cross-section in the map view; detects inconsistent `:lanes` pipe counts and key typos; configurable colors/opacity; left-hand traffic support (nearly untested).

## Known limits

Max 8 lanes per direction; `turn:lanes` without suffix only on `oneway=yes`; `oneway=-1` issues; width not geographically accurate ([#8588](https://josm.openstreetmap.de/ticket/8588)).

## Editor implication

De facto standard JOSM lane QA layer; referenced from [Lanes wiki](https://wiki.openstreetmap.org/wiki/Lanes#Editor_support) and [community forum](https://community.openstreetmap.org/t/josm-map-style-lane-and-road-attributes/99251). Pairs with [turnlanes-tagging](./josm-turnlanes-tagging.md) for turn-lane editing.

## Sources

- https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes
- https://josm.openstreetmap.de/wiki/Presets/Lane_Attributes
- https://wiki.openstreetmap.org/wiki/Lanes#Editor_support
- https://community.openstreetmap.org/t/josm-map-style-lane-and-road-attributes/99251
