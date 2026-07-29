# OsmAnd — Lanes navigation widget

Research note on OsmAnd as a production consumer of `turn:lanes` (not an editor).

## Overview

| Field | Value |
| --- | --- |
| **Status** | Production navigation |
| **Docs** | https://osmand.net/docs/user/widgets/nav-widgets/ (Lanes widget) |

## Tags touched

Primarily `turn:lanes` (+ `:forward`/`:backward`/`:both_ways`); **not** bare `turn=*` ([issue #12481](https://github.com/osmandapp/OsmAnd/issues/12481)).

## UX

Lane diagram widget during navigation; highlights recommended lane.

## Editor implication

Cited in [iD #387 (2016)](https://github.com/openstreetmap/iD/issues/387#issuecomment-220456894) as proof `turn:lanes` data has real-world consumers. Other wiki-listed consumers (Organic Maps, Magic Earth, Mapbox Navigation SDK, OSM2World): [tags/turn-lanes.md](../tags/turn-lanes.md#effects-on-rendering--editing).

## Sources

- https://osmand.net/docs/user/widgets/nav-widgets/
- https://github.com/osmandapp/OsmAnd/issues/12481
- https://github.com/openstreetmap/iD/issues/387
