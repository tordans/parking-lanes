# JOSM built-in Turn Lanes plugin (core)

Research note on the older JOSM Turn Lanes plugin (turn relations / lane lengths), distinct from [turnlanes-tagging](./josm-turnlanes-tagging.md).

## Overview

| Field | Value |
| --- | --- |
| **Evidence** | [JOSM source TurnLanesDialog](https://josm.openstreetmap.de/browser/osm/applications/editors/josm/plugins/turnlanes/src/org/openstreetmap/josm/plugins/turnlanes/gui/TurnLanesDialog.java) |
| **Tags** | Turn relations, lane lengths (separate from `turn:lanes` tagging plugin) |
| **Status** | Referenced in forum as “JOSM lane editor” alongside validator; relationship to turnlanes-tagging unclear |

## Editor implication

Two different codebases exist in the JOSM ecosystem for “turn lanes.” Public docs do not clearly state which one [iD #387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785) criticizes. Prefer [turnlanes-tagging](./josm-turnlanes-tagging.md) as the active `turn:lanes` editor reference unless core plugin behaviour is needed.

## Sources

- https://josm.openstreetmap.de/browser/osm/applications/editors/josm/plugins/turnlanes/src/org/openstreetmap/josm/plugins/turnlanes/gui/TurnLanesDialog.java
- https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033
