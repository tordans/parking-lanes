# OsmLaneVisualizer

Research note on [OsmLaneVisualizer](https://github.com/mueschel/OsmLaneVisualizer) — a QA/visualization tool, not an editor. Code reviewed **2026-07-29** against `master` ([`OSMLanes.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMLanes.pm), [`OSMDraw.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMDraw.pm), [`OSMData.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMData.pm), [`render.pl`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl), [`style.scss`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/style.scss)).

## Overview

| Field | Value |
| --- | --- |
| **Name** | OsmLaneVisualizer / OSM Lane Visualizer |
| **Author** | Mueschel (Jan Michel) |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Repo** | https://github.com/mueschel/OsmLaneVisualizer |
| **Live tool** | https://osm.mueschelsoft.de/lanes/render.pl |
| **Legacy URL** | https://osm.mueschelsoft.de/cgi-bin/render.pl (still works; referenced in older links, e.g. [iD #387](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634)) |
| **QA deep link** | [A 661 with all toggles](https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes) |
| **Wiki** | https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer |
| **Stack** | Perl CGI → Overpass JSON → HTML/CSS cross-sections + Leaflet map preview |
| **Status** | Active QA tool; taginfo project file last updated 2019-01-20 |

README advertises “at least 105 different keys.” Taginfo lists 170 keys. **No `parking` / `parking:lane` references exist in current source** (resolves the older [Quality assurance wiki](https://wiki.openstreetmap.org/wiki/Quality_assurance) note — that claim is outdated for this codebase).

## Architecture

```
render.pl (CGI)
  ├─ parse URL flags → set OSMLanes globals ($USEplacement, $adjacent, …)
  ├─ OSMData::readData(Overpass query) → $store->{way|node|rel}
  ├─ OSMData::organizeWays() → before/after chain links via shared end nodes
  ├─ pick start end-node ($start) → mark {reversed} if chain walked from “after”
  ├─ optional adjacent Overpass fetch into $store set [1]
  └─ walk chain: for each way → OSMDraw::drawWay
                    └─ OSMLanes::InspectLanes → HTML lane DIVs
```

| Module | Role |
| --- | --- |
| [`render.pl`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl) | CGI entry; query builders (`wayid`/`relid`/`relref`/`relname`); chain walk; HTML shell + Leaflet |
| [`OSMData.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMData.pm) | Overpass fetch/parse; way topology (`before`/`after`); length/bearing helpers |
| [`OSMLanes.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMLanes.pm) | **Tag interpretation** → per-lane arrays (`fwd`/`bck`/`both`/`none`, turn, change, access, …) |
| [`OSMDraw.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMDraw.pm) | **HTML rendering** of one way cross-section + signs/destinations/turns |
| [`style.scss`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/style.scss) (+ `de.scss`/`be.scss`) | Lane colours, solid/dashed borders from `change` CSS classes, country sign skins |

Drawing constants (`OSMLanes.pm`): `$LANEWIDTH = 120` px, `$LANEHEIGHT = 135` px, `$STROKEWIDTH = 3`, `$maxlanes = 4` (used as **layout centre index**, not a hard lane cap).

## How visualization works

### Page layout (one row = one OSM way)

Each `drawWay` emits a horizontal strip:

| Column | Content |
| --- | --- |
| **Label** (left) | Cumulative km, way ID (hover → Leaflet polyline), length, Mapillary / JOSM / Level0 links |
| **Info** | `ref` / `int_ref` badges, `name` (+ `bridge:name` / `tunnel:name`), way-level maxspeed/minspeed + access signs, optional node signs |
| **Placeholder** | Floated lane DIVs (sidewalk → shoulder → lanes → shoulder → sidewalk), skewed/offset for placement |

Ways are stacked vertically along the route. A thin `sep` bar between ways can show `highway=motorway_junction` name/ref from the begin node.

### Lane strip (CSS, not canvas/SVG)

Each carriageway lane is a floated `div.lane` with classes:

| Class | Meaning | Visual ([`style.scss`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/style.scss)) |
| --- | --- | --- |
| `forward` | Travel with way direction | Greenish `#cdc` fill; dashed white side borders by default |
| `backward` | Opposite direction | Reddish `#dcc` fill |
| `bothlane` | `lanes:both_ways` centre / reversible | Grey `#ccccc5`; **solid** borders |
| `nolane` | Gap / traffic-calming island / leftover `lanes` count | Diagonal hatch gradient |
| `restrictlane` | Designated bike/foot/bus/psv or `access=no` | Grey `#aaa`; solid borders |
| `not_left` / `not_right` / `no` | From `change:*` (after normalisation) | Solid white on that edge (vs dashed = change allowed) |

Direction × change interaction: `not_left.forward` / `not_right.backward` solidify the **left** edge; `not_right.forward` / `not_left.backward` solidify the **right** edge — so “left/right” are interpreted in the lane’s travel direction.

Inside each lane cell (if not `nolane`):

1. **Turn glyphs** (`makeTurns`) — Unicode arrows from `turn:lanes` values (`through` ↑, `left` ↰, `slight_right` ↗, `merge_to_*`, `reverse`, …).
2. **Destination sign** (`makeDestination`) — stacked destinations/refs/colours/symbols/countries/arrows/distances.
3. **Per-lane signs** — maxspeed/minspeed circles + access pictograms (`makeSigns` with lane index).
4. **Width label** — `⇠3.5⇢` text when width known but `lanewidth` toggle is **off** (when toggle is on, cell width scales in px instead).

Side features wrap the carriageway:

- **Shoulder** — grey `shoulder` / thin `noshoulder` marker; adjusts `offset`.
- **Sidewalk** — light-blue `sidewalk` / `nosidewalk`; optional `sidewalk:*:width` scales px width (`LANEWIDTH/4 × metres`).

Bridge/tunnel: CSS class on the placeholder (`bridge` / `tunnel`) draws a shadow/overlay via `::after`. Placement tilt applies `transform:skewX(tilt)` on the whole placeholder and counter-skew on inner signs.

### Chain walking

1. Index every way’s first/last node → `endnodes`.
2. Ways with no `before` or no `after` are “ends”; `$start` picks the Nth.
3. Walk via `after`, choosing next with `getBestNext` (smallest absolute turn angle; for `junction=roundabout` prefers the largest angle).
4. If next way is attached end-to-end, set `{reversed}=1` and flip node order / before-after before drawing.
5. With `$adjacent`, a second Overpass pass loads ways sharing the end node; `makeWaylayout` draws a mini junction diagram and may preview destination signs of a single continuing side road.

### Live endpoints / URL params

| Endpoint | URL |
| --- | --- |
| **Current** | https://osm.mueschelsoft.de/lanes/render.pl |
| **Legacy** | https://osm.mueschelsoft.de/cgi-bin/render.pl |

| Param | Role |
| --- | --- |
| `relref` / `relid` / `relname` / `wayid` / `url` | Data source |
| `start` | 1-based end-node index |
| `country` | `de` \| `be` — sign CSS / ref styling |
| `placement` | Enable placement offset / tilt |
| `adjacent` | Fetch neighbouring ways at junctions |
| `lanewidth` | Scale lane DIV widths from metres |
| `usenodes` | Show node highway signs along the way |
| `extendway` | Extend short way sets by `ref`; continuation arrows |
| `extrasize` | `$LANEWIDTH *= 1.53` |

## How tags are used in code

### Pipeline: `InspectLanes`

Called once per drawn way ([`OSMLanes.pm`](https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMLanes.pm)):

1. `getLanes` — build direction list  
2. `getWidth` — per-lane metres  
3. `getPlacement` — `offset` / `tilt`  
4. `getChange` — border CSS classes  
5. `getLaneTags` for: `turn`, `maxspeed`, `minspeed`, `bicycle`, `bus`, `psv`, `foot`, `access`, `hgv`  
6. `makeAccess` — append `restrictlane` class  
7. `getLaneTags` for all `destination*` keys (stored under colon-stripped names, e.g. `destinationref`)

### Generic `:lanes` expander — `getLaneTags($obj, $tag, $options)`

Fills an array of length `numlanes` (layout order: **backward → both_ways → nolane → forward**; reversed when the way is flipped for drawing).

Application order (later wins for a given slot):

| Priority | Tag form | Behaviour |
| --- | --- | --- |
| 1 | `$tag` (bare) | Fill **all** slots (skipped if option `nonolanes`) |
| 2 | `$tag:backward` / `:both_ways` / `:forward` | Fill that direction’s block with the same value |
| 3 | `$tag:lanes` | Pipe-split; index = left-to-right in layout order |
| 4 | `$tag:lanes:backward` | Pipe-split; stored **right-to-left within backward block** (`bck-1-i`) — OSM `:lanes:backward` is left-to-right in travel direction |
| 5 | `$tag:lanes:both_ways` / `:lanes:forward` | Pipe-split into those blocks |
| 6 | reverse array if way `{reversed}` (unless option `noreverse`) |

This is the core model an editor needs for QA parity: decompose every `*:lanes*` variant into a left-to-right lane array relative to a chosen travel orientation.

### Lane count — `getLanes`

1. For every key matching `/:lanes/`, count `|` separators + 1; bucket into forward / backward / both_ways / bare pools.  
2. Also push numeric `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways`.  
3. Infer missing direction: `lanes - lanes:forward` → backward (and vice versa); same with max-of-pools.  
4. Oneway (`oneway` defined and ≠ `no`): treat `lanes` as forward; also push all bare `:lanes` pipe counts into forward.  
5. Two-way defaults: if a side still empty, use `lanes/2`; always ensure at least 1 forward and 1 backward candidate.  
6. **`fwd` / `bck` / `both` = max of each pool** (deliberately surfaces stray pipes).  
7. Extra `nolane` slots: `traffic_calming=island` → 1; or if `lanes` > fwd+bck+both, remainder becomes `nolane` gaps.

**Editor implication:** Max-of-all is a **validation** strategy, not a tagging rule — same tension as [iD #387](https://github.com/openstreetmap/iD/issues/387#issuecomment-220456894) (`lanes=*` motorised count vs `*:lanes` including bike/tram).

### Width — `getWidth`

- `getLaneTags('width','nonolanes')` → `width:lanes*` etc.  
- Island/`nolane` slot defaults to `4*0.6` m, overridable by `traffic_calming:width`.  
- Bare `width` ÷ `numlanes` fills empty slots.  
- Missing width contributes **4 m** to `totalwidth` for placement-with-lanewidth maths.  
- With `lanewidth` flag: cell CSS width = `metres * LANEWIDTH/4 - 2*STROKEWIDTH`.

### Change / overtaking — `getChange`

- Load `change` via `getLaneTags(..., 'noreverse')` then normalise: strip `yes`; map `only_left`→`not_right`, `only_right`→`not_left`.  
- `overtaking=no` appends `not_left` on the innermost forward and backward lanes (centreline ban).  
- Force outer roadside edges solid (`not_right`/`not_left` on first/last lane).  
- Reverse change array if way reversed (done manually because of `noreverse` during load).

### Placement — `getPlacement`

Three modes:

| Mode | Behaviour |
| --- | --- |
| **Default** (no flags) | Centre the carriageway using `$maxlanes` and bck/both counts × `$LANEWIDTH` |
| **`placement` flag** | Parse `placement` / `:forward`/`:backward` / `:start`/`:end`; `right_of:N` → N+1, `middle_of:N` → N+0.5, `transition` → undef (falls back to centre). Start≠end → average offset + `tilt` angle from `atan2` |
| **`lanewidth` + has width** | Offset from cumulative metre widths (oneway-aware `placement`); else centre on `totalwidth/2` |

Experimental Imagic transition detail is only the `transition` → undef branch (no extra geometry).

### Access colouring — `makeAccess`

Appends CSS class `restrictlane` when a lane has `bicycle`/`foot` ∈ {designated, official}, `psv`/`bus` = designated, or `access`/`vehicle` = `no`.

**Code quirk:** `vehicle` is referenced but **never loaded** via `getLaneTags('vehicle')` in `InspectLanes` — so `vehicle:lanes` does not currently drive restrict colouring.

### Destination signs — `makeDestination` / `makeAllDestinations`

Per-lane fields (from `getLaneTags` on each key): `destination`, `destination:ref`, `:colour`, `:symbol`, `:country`, `:arrow`, `:int_ref`, `:distance`, and the `:to` / `:ref:to` / … variants. Semicolon lists are split; colours become inline background; arrows become Unicode; countries sit beside destinations or grouped at bottom if counts mismatch. Adjacent-way preview can show destinations of a connecting way (`makeWaylayout`).

### Way-level / node-level (not per-lane arrays)

| Tags | Rendering |
| --- | --- |
| `ref`, `int_ref` | Country-styled badges (`refA`/`refB`/…) |
| `name`, `bridge:name`, `tunnel:name` | Info column |
| `maxspeed` / `minspeed` (+ `:forward`/`:backward`, `:hgv`, `:conditional`) | Sign DIVs in info column; lane-dependent also inside lanes |
| `overtaking`, `bicycle`, `foot`, `bus`, `psv`, `hgv`, `motorroad`, `junction=roundabout` | Way-level pictograms via `makeSigns` |
| Node `highway=traffic_signals\|give_way\|stop\|crossing\|mini_roundabout` | If `usenodes` |
| Begin node `highway=motorway_junction` | Junction label in separator |
| `bridge=*` / `tunnel=*` | Placeholder CSS class |
| `shoulder` / `shoulder:left|right` | Shoulder strips |
| `sidewalk` / `sidewalk:left|right|both` (+ widths) | Sidewalk strips |

### Interpreted tags (README checklist)

Suffix notation: `[:lanes][:forward|:backward|:both_ways]` optional combinations — implemented by `getLaneTags` as above.

| Tag / pattern | Code path |
| --- | --- |
| `lanes[:forward\|:backward\|:both_ways]` | `getLanes` |
| `turn[:lanes][…]` | `getLaneTags` → `makeTurns` |
| `change[:lanes][…]` | `getChange` → CSS borders |
| `width[:lanes][…]` | `getWidth` → px or label |
| `placement[…]` | `getPlacement` → margin/skew |
| `bicycle` / `bus` / `psv` / `foot` / `hgv` / `access` `[:lanes][…]` | `getLaneTags` + `makeAccess` / `makeSigns` |
| `maxspeed` / `minspeed` (+ conditional/hgv) | `makeMaxspeed` + per-lane |
| `destination*` family | `makeDestination` |
| `overtaking[:hgv][…]` | `getChange` + signs |
| `shoulder*`, `sidewalk*` | `makeShoulder` / `makeSidewalk` |
| `traffic_calming=island` (+ width) | `nolane` + width |
| `bridge` / `tunnel` (+ names) | CSS + name column |
| `oneway` | Lane allocation / placement |

**Not implemented in code (despite wiki rumour):** any `parking:lane*` schema.

## UX summary

- **Input:** Way/relation id, relation `ref`/`name`, or custom Overpass/JSON.  
- **Output:** Schematic HTML cross-section of a continuous chain (not map-embedded lane polygons).  
- **Map:** Hover way ID → Leaflet marker + polyline (`generateMapJS`).  
- **Config toggles** re-query via `changeURL()`.

## Editor implications

1. **Cross-section UX reference** — repeatedly cited in [iD #387](https://github.com/openstreetmap/iD/issues/387) ([@tordans](https://github.com/openstreetmap/iD/issues/387#issuecomment-278999376), [@1ec5](https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769)).  
2. **Decompose/reassemble model** — `getLaneTags` is the practical algorithm for merging bare / directional / `:lanes` variants into one L→R array; editors need the same for round-trip editing (cf. [slhh](https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634)).  
3. **Max pipe count ≠ `lanes=*`** — treat as QA signal.  
4. **Change borders are CSS classes on lanes**, not separate divider objects — `change` + `overtaking` both feed the same edge solid/dashed model.  
5. **Read-only + CC BY-NC-SA** — validate editor output; license review before embedding.  
6. **Gaps vs a full editor:** no `vehicle:lanes` load; no parking; destination/sign logic is DE/BE-centric; `$maxlanes=4` only affects placement centring maths, not a hard render limit.

## Open confirmations

- ~~Still using deprecated `parking:lane`?~~ **No** — confirmed absent from `master` sources (2026-07-29).  
- Whether `vehicle:lanes` was intended in `makeAccess` (referenced but never populated) — likely unfinished.

## Sources

- https://github.com/mueschel/OsmLaneVisualizer
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMLanes.pm
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMDraw.pm
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/OSMData.pm
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/render.pl
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/style.scss
- https://github.com/mueschel/OsmLaneVisualizer/blob/master/README.md
- https://osm.mueschelsoft.de/lanes/render.pl
- https://osm.mueschelsoft.de/lanes/render.pl?relref=A%20661&start=1&country=de&placement&adjacent&lanewidth&usenodes
- https://wiki.openstreetmap.org/wiki/OSM_Lane_Visualizer
- https://github.com/openstreetmap/iD/issues/387
