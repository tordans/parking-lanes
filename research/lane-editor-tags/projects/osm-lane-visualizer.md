# OsmLaneVisualizer

Research note on [OsmLaneVisualizer](https://github.com/mueschel/OsmLaneVisualizer) — a QA/visualization tool, not an editor.

## Overview

| Field | Value |
| --- | --- |
| **Name** | OsmLaneVisualizer / OSM Lane Visualizer |
| **Author** | Mueschel (Jan Michel) |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Repo** | https://github.com/mueschel/OsmLaneVisualizer |
| **Live tool** | https://osm.mueschelsoft.de/lanes/render.pl |
| **Legacy URL** | https://osm.mueschelsoft.de/cgi-bin/render.pl (still works; referenced in older links, e.g. [iD #387](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634)) |
| **QA deep link** | [A 661 with all toggles](https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes) — see [Live endpoints](#live-endpoints) |
| **Wiki** | https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer |
| **Stack** | Perl, SCSS, CSS; fetches data via Overpass API; outputs HTML |
| **Status** | Active QA tool; taginfo project file last updated 2019-01-20 per [taginfo](https://osm.mueschelsoft.de/lanes/taginfo.json) |

The README advertises support for “at least 105 different keys.” The [taginfo project file](https://osm.mueschelsoft.de/lanes/taginfo.json) lists 170 keys.

## Live endpoints

Both URLs serve the same Perl CGI tool; only the path differs.

| Endpoint | URL | Notes |
| --- | --- | --- |
| **Current** | https://osm.mueschelsoft.de/lanes/render.pl | Documented in README and wiki |
| **Legacy** | https://osm.mueschelsoft.de/cgi-bin/render.pl | Still functional; used in older bookmarks and [iD #387](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634) |

Query parameters are preserved across both paths. The UI’s “Link to this page” rebuilds the same query string (see [`render.pl`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl) `changeURL()`).

### QA smoke-test deep link

German Autobahn **A 661** with placement, adjacent ways, lane width, and node tags enabled — useful for lane-editor regression checks (motorway junctions, `turn:lanes`, `destination:lanes`, speed limits, bridge/tunnel segments):

```
https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes
```

Legacy-path equivalent: [cgi-bin/render.pl?…](https://osm.mueschelsoft.de/cgi-bin/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes)

At fetch time (2026-07-25) this relation produced **20 numbered end nodes** along the chain; `start=1` selects the first.

### URL query parameters

Decoded from the smoke-test URL and confirmed against live HTML + [`render.pl`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl) source.

| Param | Example value | Role | UX / research notes |
| --- | --- | --- | --- |
| `relref` | `A 661` | Relation lookup by `ref` | Builds an Overpass query for the motorway relation; alternative inputs: `relid`, `relname`, `wayid`, or raw `url=` Overpass query |
| `start` | `1` | End-node index | Motorway relations have multiple chain endpoints; picks which “last way” to start the cross-section from (1-based; tool reports total count) |
| `country` | `de` | Driving-side / sign locale | Selects country context (`be`, `de` in source); affects sign conventions and related rendering |
| `placement` | *(flag, no value)* | Enable placement | Checkbox “Use placement”; reads `placement[:forward\|:backward][:start\|:end]` |
| `adjacent` | *(flag)* | Enable adjacent ways | Checkbox “Use adjacent ways”; fetches parallel neighbouring ways via Overpass for shoulder/sidewalk/cycleway context |
| `lanewidth` | *(flag)* | Enable per-lane width | Checkbox “Use lane width”; reads `width[:lanes][:forward\|:backward]` |
| `usenodes` | *(flag)* | Enable node tags | Checkbox “Use tags on nodes”; shows traffic signals, crossings, etc. on nodes |
| `extendway` | *(flag)* | Extend chain | “Include ways before & after” — extends short way sets |
| `extrasize` | *(flag)* | Larger lanes | Scales lane width ×1.53 for readability (not in smoke-test URL) |

Sources: [live A 661 render](https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes), [`render.pl`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl), [README](https://github.com/mueschel/OsmLaneVisualizer/blob/master/README.md), [wiki](https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer).

## UX

- **Input:** Way/relation id, relation `ref` or `name`, or a custom Overpass query / JSON object (also via URL params above).
- **Output:** Schematic **HTML cross-section** of a continuous road segment (not map-embedded lane overlays).
- **Interaction:** Mouse-over on “way” shows all tags; hover over way ID updates a map preview.
- **Configuration toggles** (live UI or URL flags; re-run query after changing):
  - *Use placement* → `placement`
  - *Use adjacent ways* → `adjacent`
  - *Use lane width* → `lanewidth`
  - *Use tags on nodes* → `usenodes`
  - *Include ways before & after* → `extendway`
  - Country / “start at end number” for multi-way chains → `country`, `start`
- **Data model:** Works on chains of continuous ways from Overpass; user picks which “end” way to visualize when multiple exist.

## Lane-count rules

From the README “Number of Lanes” section:

1. Read all tags on the way containing a `:lanes` part **and** the `lanes` tag itself.
2. For **forward** and **backward** separately, take the **maximum** lane count found.
3. This max may **not** match the intended real-world lane count; the tool uses it deliberately to surface tagging errors (e.g. stray `|` pipe characters).

**Editor implication:** An editor should not assume `lanes=*` always equals the pipe-count in `*:lanes` tags. OsmLaneVisualizer’s max-of-all approach is a **validation** strategy, not a normative tagging rule. This matches the long-standing distinction discussed in [iD #387](https://github.com/openstreetmap/iD/issues/387#issuecomment-220456894): `lanes=*` counts motorized full-width lanes; `*:lanes` can include bike lanes, tram lanes, etc.

## Placement support

| Tag pattern | Behavior |
| --- | --- |
| `placement[:forward\|:backward][:start\|:end]` | Positions lanes when “Use placement” is enabled |
| `placement=transition` | **Experimental** support for a tag proposed by Imagic (extra detail for placement transitions) |

Sources: [README Interpreted Tags](https://github.com/mueschel/OsmLaneVisualizer/blob/master/README.md#interpreted-tags).

## Interpreted tags (from README)

Suffix notation in README: `[:lanes][:forward|:backward|:both_ways]` means the `:lanes` and direction suffixes are optional combinations.

| Tag / pattern | Rendering / use |
| --- | --- |
| `bicycle[:lanes][…]` | Values `no`, `designated`, `official` displayed |
| `bridge[:name]` | Bridge shadow behind lanes; name shown |
| `bus[:lanes][…]` | Values `designated`, `official` displayed |
| `change[:lanes][…]` | Solid or dashed lines between lanes |
| `destination[:lanes][…]` | On destination signs |
| `destination:arrow[:lanes][…]` | On destination signs |
| `destination:colour[:lanes][…]` | Background color per destination on sign |
| `destination:country[:lanes][…]` | Country codes next to destinations or grouped at bottom |
| `destination:distance[:lanes][…]` | On destination signs |
| `destination:ref[:lanes][…]` | Refs at bottom of each sign |
| `destination:ref:to[:lanes][…]` | Refs at bottom of each sign |
| `destination:symbol[:lanes][…]` | Common symbols next to destination names |
| `destination:symbol:to[:lanes][…]` | Common symbols next to destination names |
| `destination:to:ref[:lanes][…]` | Refs at bottom of each sign |
| `foot[:lanes][…]` | Values `no`, `designated`, `official` displayed |
| `highway=motorway_junction` | Junction name/ref at end of way |
| `highway=traffic_signals\|give_way\|stop\|crossing\|mini_roundabout` (nodes) | Corresponding traffic sign |
| `hgv[:lanes][…]` | Values `no`, `designated`, `official` displayed |
| `int_ref` | Left column and signs |
| `junction=roundabout` | Roundabouts marked |
| `lanes[:forward\|:backward\|:both_ways]` | Lane count; may be overridden by other tags |
| `maxspeed` / `minspeed` | Left-hand side |
| `maxspeed[:lanes][…]` / `minspeed[:lanes][…]` | Left-hand side; inside lane when lane-dependent |
| `maxspeed:conditional` / `minspeed:conditional` | Left-hand side; no lane/direction dependence |
| `maxspeed:hgv` / `minspeed:hgv` | Left-hand side; no lane/direction dependence |
| `motorroad=yes` | Corresponding sign |
| `name` | Left column |
| `oneway` | Mostly supported; `oneway=-1` may fail in some cases |
| `overtaking[:hgv][:forward\|:backward]` | Solid line between forward/backward lanes |
| `placement[:forward\|:backward][:start\|:end]` | Lane positioning (optional; see above) |
| `psv[:lanes][…]` | Values `designated`, `official` displayed |
| `ref` | Left column; sign color |
| `shoulder[:left\|:right]` | Gray area beside road |
| `sidewalk[:left\|:right\|:both]` | Light blue beside road |
| `sidewalk[:left\|:right\|:both]:width` | Used if enabled |
| `traffic_calming=island` | Dark area between lanes |
| `traffic_calming:width` | Used if enabled |
| `tunnel:name` | Name shown if available |
| `turn[:lanes][…]` | Unicode turn characters |
| `width[:lanes][:forward\|:backward]` | Used if “Use lane width” enabled |

## Editor implications

1. **Cross-section UX reference:** Cited repeatedly in [iD #387](https://github.com/openstreetmap/iD/issues/387) as the clearest existing visualization of lane tagging (vs. map overlays). [@tordans (2017)](https://github.com/openstreetmap/iD/issues/387#issuecomment-278999376), [@1ec5 (2018)](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769).
2. **Breadth of `*:lanes` keys:** Supports destination subkeys, access modes, change, width, placement — far beyond turn lanes alone. Any lane editor aiming for QA parity needs a similar decompose/reassemble model (see [slhh’s temporary lane object proposal](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634)).
3. **Direction + driving side:** Tool separates forward/backward; community discussion in #387 notes that bare `:lanes` on two-way roads is ambiguous without `driving_side`.
4. **Read-only QA role:** CC BY-NC-SA license and no edit path — useful for validating editor output, not for direct integration without license review.
5. **Adjacent ways / node tags:** Optional inclusion of neighboring ways and node-level highway tags suggests editors may need cross-way context for complete visualization.

## Sources

- https://github.com/mueschel/OsmLaneVisualizer/blob/master/README.md
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl
- https://osm.mueschelsoft.de/lanes/render.pl
- https://osm.mueschelsoft.de/cgi-bin/render.pl
- https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes (QA deep link)
- https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer
- https://github.com/openstreetmap/iD/issues/387
