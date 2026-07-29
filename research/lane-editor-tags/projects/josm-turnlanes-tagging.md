# JOSM — turnlanes-tagging plugin

Research note on the maintained JOSM plugin for editing `turn:lanes` tags.

## Overview

| Field | Value |
| --- | --- |
| **Status** | Maintained JOSM plugin |
| **Repo** | https://github.com/JOSM/turnlanes-tagging |
| **Shortcut** | Alt+Shift+2 (Data → Turn lanes tagging editor) |

Distinct from the older [JOSM core Turn Lanes plugin](./josm-turnlanes-core.md) (turn relations / lane lengths).

## Tags touched

`turn:lanes`, `turn:lanes:forward`, `turn:lanes:backward`, `turn:lanes:both_ways`; auto-updates `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways`.

## UX

Preset icons for common turn-lane combinations; recent-edits tab; fixes lane count mismatches against `turn:lanes` pipe count. Pairs with **[Lane and Road Attributes](./josm-lane-and-road-attributes.md)** style for arrow overlay.

## Editor implication

Focused turn-lane editor only — does not handle `destination:lanes`, `change:lanes`, `placement`, etc. Criticized as limited in [iD #387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785).

## Open question

Which plugin [#387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785) criticizes — this one or [josm-turnlanes-core.md](./josm-turnlanes-core.md)? Relationship between the two codebases is unclear from public docs.

## Sources

- https://github.com/JOSM/turnlanes-tagging
- [Mapbox Medium post (2016)](https://medium.com/mapbox/turnlanes-tagging-plugin-for-josm-a93220e9aa0)
- https://github.com/openstreetmap/iD/issues/387
