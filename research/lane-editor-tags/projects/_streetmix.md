# Streetmix

Design-reference note — drag-and-drop street cross-section; **not** an OSM tag editor.

## Overview

| Field | Value |
| --- | --- |
| **URL** | https://streetmix.net/ |
| **Mentioned in** | [iD #387 @1ec5 (2018)](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769); [#789 @tordans](https://github.com/a-b-street/abstreet/discussions/789) |
| **Coverage** | Shallow — optional follow-up (data model vs `:lanes`; no OSM export) |

## UX

Drag-and-drop street cross-section (sidewalks, bike lanes, parking, transit, trees). Inspiration for sidebar mini-editor.

## Tags touched

None directly — conceptual UX reference. [@tordans (2019)](https://github.com/openstreetmap/iD/issues/387#issuecomment-484789342) lists desired facets (sidewalks, parking, tram, kerbs, bollards). In [#789](https://github.com/a-b-street/abstreet/discussions/789), @tordans prioritizes a Streetmix-like tool that **outputs OSM tagging recommendations**; @dabreegster links iD #387 and AB Street road editor as partial starts.

## Editor implication

Primary **cross-section UX** inspiration alongside [OsmLaneVisualizer](./osm-lane-visualizer.md) and [_bhousel-codepen.md](./_bhousel-codepen.md). Related: [_streetplan.md](./_streetplan.md), [_3dstreet.md](./_3dstreet.md).

## Sources

- https://streetmix.net/
- https://github.com/openstreetmap/iD/issues/387
- https://github.com/a-b-street/abstreet/discussions/789
