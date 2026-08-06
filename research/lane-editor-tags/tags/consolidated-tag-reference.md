# Consolidated lane tag reference

Master table for lane-editor research. **Editor priority:** must = core editing; should = common real-world cases; nice = advanced/conditional/experimental.

Projects: **SRK** = Straßenraumkarte, **O2L** = osm2lanes (archived), **O2S** = osm2streets, **MUV** = muv-osm (active lane parser), **OLV** = OsmLaneVisualizer, **MM** = Map Machine (road lanes mode), **JOSM-LF** = JOSM lane_features style, **JOSM-LRA** = JOSM Lane and Road Attributes style, **OLP** = [k-yle/osm-lane-parser](../projects/kyle-kiwi-id-lanes.md) (Kyle Lane Editor backend).

**Note:** O2S per-way lane parsing delegates to **MUV** since [osm2streets PR #233](https://github.com/a-b-street/osm2streets/pull/233); O2L rows reflect the archived in-repo algorithm.

| Tag | Category | Used by | Editor priority | Wiki EN | Wiki DE | Notes |
|-----|----------|---------|-----------------|---------|---------|-------|
| `lanes` | physical | SRK, O2S, OLV, MM, JOSM-LF, JOSM-LRA | must | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | Motorised lane count; excludes bike, includes bus; MM: width = lanes × 3.7 m + separators |
| `lanes:forward` | physical | SRK, O2S, OLV, MM, JOSM-LF | must | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | Lanes in OSM way direction; MM: marks forward lane objects only |
| `lanes:backward` | physical | SRK, O2S, OLV, MM, JOSM-LF | must | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | Lanes opposite OSM way; MM: marks backward lane objects only |
| `lanes:both_ways` | physical | O2S, OLV, JOSM-LF | must | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | Centre two-way turn lane count |
| `lanes:both` | physical | JOSM-LF | nice | — | — | JOSM style variant; prefer `lanes:both_ways` |
| `lanes:psv` | physical | SRK, OLV, JOSM-LF | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Count of PSV-reserved lanes |
| `lanes:bus` | physical | OLV | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Bus-only count (not taxis) |
| `lanes:taxi` | physical | — | nice | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | Taxi lane count |
| `lanes:hov` | physical | — | nice | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | — | HOV/carpool lane count |
| `lanes:hgv` | physical | — | nice | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes) | **Reserved** HGV lane count — not restriction |
| `lanes:conditional` | physical | O2S | nice | [Conditional restrictions](https://wiki.openstreetmap.org/wiki/Conditional_restrictions) | — | Time-varying lane count |
| `lanes:*:conditional` | physical | — | nice | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | e.g. `lanes:psv:conditional` |
| `access:lanes` | access | OLV, JOSM-LF, JOSM-LRA | must | [Key:access](https://wiki.openstreetmap.org/wiki/Key:access) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | General access per lane |
| `access:lanes:forward` | access | OLV, JOSM-LF | must | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Forward direction |
| `access:lanes:backward` | access | OLV, JOSM-LF | must | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Backward direction |
| `vehicle:lanes` | access | SRK, O2S, OLV | must | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Motor vehicle access; often `no` on bike slots |
| `bicycle:lanes` | access | SRK, OLV, O2S | must | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Cycle access/designation per slot |
| `bus:lanes` | access | OLV, SRK | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Bus lane position |
| `psv:lanes` | access | OLV | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | PSV designation per lane |
| `taxi:lanes` | access | — | nice | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Taxi in bus lane |
| `hgv:lanes` | access | OLV, JOSM-LRA | should | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | HGV restriction per lane |
| `foot:lanes` | access | OLV | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | — | Pedestrian lanes |
| `motorcycle:lanes` | access | — | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | — | Motorcycle-specific narrow lanes |
| `motor_vehicle:lanes` | access | — | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | — | Explicit motor vehicle lanes |
| `emergency:lanes` | access | — | nice | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Emergency vehicle access |
| `turn:lanes` | marking | SRK, O2S, OLV, JOSM-LF, JOSM-LRA | must | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | [DE:Key:turn:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes) | Prefer `:forward`/`:backward` on two-way |
| `turn:lanes:forward` | marking | SRK, O2S, OLV, JOSM-LF | must | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | [DE:Key:turn:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes) | |
| `turn:lanes:backward` | marking | O2S, OLV, JOSM-LF | must | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | [DE:Key:turn:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes) | |
| `turn:lanes:both_ways` | marking | O2S, OLV | should | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | — | Centre turn lane arrows |
| `turn:bus:lanes` | marking | — | nice | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | — | Bus-specific turn arrows |
| `turn:psv:lanes` | marking | — | nice | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | — | |
| `turn:bicycle:lanes` | marking | — | nice | [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) | — | |
| `change:lanes` | marking | O2S, OLV, JOSM-LF | should | [Key:change](https://wiki.openstreetmap.org/wiki/Key:change) | — | Lane change restrictions |
| `change:lanes:forward` | marking | OLV, JOSM-LF | should | [Key:change](https://wiki.openstreetmap.org/wiki/Key:change) | — | |
| `change:lanes:backward` | marking | OLV, JOSM-LF | should | [Key:change](https://wiki.openstreetmap.org/wiki/Key:change) | — | |
| `lane_markings` | marking | SRK, O2S | must | [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings) | — | `yes`/`no`; not `lanes=0` |
| `lane_markings:junction` | marking | SRK | nice | — | — | **Experimental** (Straßenraumkarte) |
| `overtaking` | marking | SRK, OLV | should | [Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking) | — | Centre-line passing; not inter-lane |
| `overtaking:forward` | marking | OLV | should | [Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking) | — | |
| `overtaking:backward` | marking | OLV | should | [Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking) | — | |
| `overtaking:hgv` | marking | — | nice | [Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking) | — | |
| `divider` | marking | — | nice | [Key:divider](https://wiki.openstreetmap.org/wiki/Key:divider) | — | Centre divider on highway way; distinct from `road_marking=lane_divider` — [road-marking.md](road-marking.md) |
| `placement` | geometry | SRK, OLV, MM, JOSM-LRA | must | [Key:placement](https://wiki.openstreetmap.org/wiki/Key:placement) | [DE:Key:placement](https://wiki.openstreetmap.org/wiki/DE:Key:placement) | Way offset vs road; MM: bare `placement` only (not `:forward`/`:backward`) |
| `placement:forward` | geometry | OLV | must | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | |
| `placement:backward` | geometry | OLV | must | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | |
| `placement=transition` | geometry | SRK, OLV, MM, JOSM-LRA | must | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | Lane count/offset transition; MM: connector deferral |
| `placement:start` | geometry | OLV | should | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | Placement at way start |
| `placement:end` | geometry | OLV | should | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | Placement at way end |
| `width` | physical | SRK, O2S, OLV, MM, JOSM-LF | must | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | Carriageway kerb-to-kerb; MM: overrides lanes×3.7 estimate |
| `width:lanes` | geometry | SRK, OLV, MM, JOSM-LRA | must | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Per-lane metres |
| `width:lanes:forward` | geometry | OLV | should | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | |
| `width:lanes:backward` | geometry | OLV | should | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | |
| `width:lanes:start` | geometry | SRK, OLV | should | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | Taper start widths |
| `width:lanes:end` | geometry | SRK, OLV | should | [Proposed features/placement](https://wiki.openstreetmap.org/wiki/Proposed_features/placement) | — | Taper end; e.g. `\|\|0` |
| `width:carriageway` | physical | — | nice | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | Prefer `width=*` |
| `est_width` | physical | — | nice | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | Estimated width |
| `source:width` | physical | SRK | should | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | e.g. `estimated` |
| `surface:lanes` | physical | O2S | should | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Per-lane surface |
| `surface:colour` | physical | SRK | nice | — | — | **Needs verification**; red/green bike lanes |
| `maxspeed:lanes` | attribute | OLV, O2S | should | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Per-lane speed limit |
| `minspeed:lanes` | attribute | OLV | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Minimum speed per lane |
| `maxwidth:lanes` | attribute | — | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Legal width limit per lane |
| `destination:lanes` | attribute | SRK, O2S, OLV | should | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Per-lane destination cities |
| `destination:ref:lanes` | attribute | OLV | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | Route refs per lane |
| `destination:ref:to:lanes` | attribute | OLV | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | |
| `destination:symbol:lanes` | attribute | OLV | nice | — | — | Symbols on signs |
| `destination:colour:lanes` | attribute | OLV | nice | — | — | Sign background colours |
| `hov:lanes` | attribute | — | nice | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | — | HOV eligibility per lane |
| `cycleway` | physical | SRK, JOSM-LF, O2S | must | [Key:cycleway](https://wiki.openstreetmap.org/wiki/Key:cycleway) | [DE:Key:cycleway](https://wiki.openstreetmap.org/wiki/DE:Key:cycleway) | Roadside cycle infrastructure |
| `cycleway:left` / `:right` / `:both` | physical | SRK, JOSM-LF | must | [Key:cycleway](https://wiki.openstreetmap.org/wiki/Key:cycleway) | [DE:Key:cycleway](https://wiki.openstreetmap.org/wiki/DE:Key:cycleway) | Side-specific |
| `cycleway:lanes` | physical | SRK, OLV | must | [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | On-carriageway cycle lane role |
| `cycleway:separation` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Draft; simple variant (strong/motor side). Values: `no`, `bollard`, `flex_post`, `vertical_panel`, `studs`, `bump`, `planter`, `kerb`, `fence`, `jersey_barrier`, `guard_rail`, `structure`, `ditch`, `greenery`, `hedge`, `tree_row`, `cone`, `yes` |
| `cycleway:separation:left` / `:right` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Detailed variant; both sides of cycleway |
| `cycleway:right:separation:left` / `:right` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Double side ref: road side + cycleway side; up to 4 keys per way |
| `cycleway:separation:*:lanes` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Per-carriageway-slot separation (centre bike lane); pipe-separated |
| `separation` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | On `highway=cycleway` (separate way); simple variant |
| `separation:left` / `separation:right` | physical | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Both sides on separate cycleway |
| `separation:lanes` / `separation:lanes:forward` | physical | SRK | nice | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Motor-lane dividers on highway way |
| `cycleway:marking` | marking | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Draft; `solid_line`, `dashed_line`, `double_solid_line`, `barred_area`, `pictogram`, `surface` |
| `cycleway:marking:left` / `:right` | marking | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Detailed variant; same side-ref rules as separation |
| `marking` / `marking:left` / `marking:right` | marking | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | On separate `highway=cycleway` |
| `cycleway:traffic_mode` | attribute | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Adjacent user context (not access): `no`, `motor_vehicle`, `parking`, `psv`, `bicycle`, `foot` |
| `cycleway:traffic_mode:left` / `:right` | attribute | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Non-default layouts (parking buffer, wrong-side lane) |
| `traffic_mode` / `traffic_mode:left` / `traffic_mode:right` | attribute | SRK | should | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | On separate cycleway; e.g. `traffic_mode:both=no` on bridge |
| `cycleway:buffer` | physical | SRK | nice | [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | — | Buffer width; companion to separation, out of proposal scope |
| `cycleway:share_busway` | access | — | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Bike in bus lane |
| `cycleway:*:width` | physical | OLV | should | [Key:cycleway](https://wiki.openstreetmap.org/wiki/Key:cycleway) | — | Side path width |
| `cycleway:*:oneway` | access | — | should | [Key:cycleway](https://wiki.openstreetmap.org/wiki/Key:cycleway) | — | Contraflow `-1` |
| `shoulder` | physical | O2L, OLV | should | [Key:shoulder](https://wiki.openstreetmap.org/wiki/Key:shoulder) | — | Excluded from `lanes`; Sidewalks: pedestrian fallback where usable |
| `shoulder:left` / `:right` | physical | OLV | should | [Key:shoulder](https://wiki.openstreetmap.org/wiki/Key:shoulder) | — | |
| `shoulder:width` | physical | OLV | nice | [Key:shoulder](https://wiki.openstreetmap.org/wiki/Key:shoulder) | — | |
| `sidewalk` | physical | JOSM-LF, OLV | should | [Key:sidewalk](https://wiki.openstreetmap.org/wiki/Key:sidewalk) | — | Not a traffic lane |
| `sidewalk:*:width` | physical | OLV | nice | [Key:sidewalk](https://wiki.openstreetmap.org/wiki/Key:sidewalk) | — | Outside carriageway `width=*` |
| `verge` / `verge:left` / `:right` / `:both` | physical | twpol | nice | [Key:verge](https://wiki.openstreetmap.org/wiki/Key:verge) | — | Berm / curb strip / tree lawn; [Sidewalks](https://wiki.openstreetmap.org/wiki/Sidewalks) pedestrian context |
| `verge:width` / `verge:*:width` | physical | — | nice | [Key:verge](https://wiki.openstreetmap.org/wiki/Key:verge) | — | Outside carriageway `width=*`; ROW composition |
| `oneway` | access | O2S, OLV, JOSM-LF | must | [Key:oneway](https://wiki.openstreetmap.org/wiki/Key:oneway) | — | Affects lane direction model |
| `oneway:bus` | access | — | should | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | Contraflow bus |
| `oneway:bicycle` | access | SRK | should | [Key:oneway](https://wiki.openstreetmap.org/wiki/Key:oneway) | — | Contraflow cycle |
| `oneway:taxi` | access | — | nice | [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes) | — | |
| `highway=busway` | physical | O2S | nice | [Tag:highway=busway](https://wiki.openstreetmap.org/wiki/Tag:highway=busway) | — | Off-carriageway bus track |
| `dual_carriageway` | geometry | SRK | nice | — | — | **Experimental**; traffic island lane spread |
| `area:highway` + `junction=yes` | geometry | SRK | nice | [Area:highway](https://wiki.openstreetmap.org/wiki/Tag:area:highway=*) | — | Junction cutout for rendering |
| `connectivity` (relation) | geometry | O2S | nice | [Relation:connectivity](https://wiki.openstreetmap.org/wiki/Relation:connectivity) | — | Lane connectivity at junctions |
| `parking:lane:*` | physical | JOSM-LF | should | [Street parking](https://wiki.openstreetmap.org/wiki/Street_parking) | [DE:Street parking](https://wiki.openstreetmap.org/wiki/DE:Street_parking) | Not in `lanes` count |
| `parking:*:width` | physical | — | nice | [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | — | Parking lane width |
| `narrow` | physical | — | nice | [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | — | Narrow two-way roads |
| `traffic_calming=island` | physical | OLV | nice | [Tag:traffic_calming=island](https://wiki.openstreetmap.org/wiki/Tag:traffic_calming=island) | — | Affects SRK lane spread |
| `road_marking` | marking | SRK† | should‡ / nice§ | [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | — | **Approved** 2025-07-10; separate geometry for junction detail — not for tracing every lane line. Values: `stop_line`, `lane_divider`, `edge_line`, `crossing_edge`, `restriction`, `crossing`, `arrow`, `traffic_sign`, `text`, `symbol`. Full notes: [road-marking.md](road-marking.md). †SRK does not consume yet; ‡should for junction/micromap editors; §nice for pure centreline lane editor v1 |
| `stroke` / `stroke:left` / `stroke:right` | marking | — | nice | [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | — | Styling subtag on `road_marking` line/area features (`solid`, `dashed`, `sharks_teeth`, …) |
| `pattern` | marking | — | nice | [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | — | Area fill on `road_marking=restriction` / `crossing` (`chevron`, `stripes`, `zigzag`, …) |
| `arrow` (on `road_marking`) | marking | — | nice | [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | — | Subtag for `road_marking=arrow`; values from `turn=*`; must match `turn:lanes` |
| `inscription` / `reason` | marking | — | nice | [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) | — | `inscription=*` for `text`; `reason=*` for `restriction` (`bus_stop`, `junction`, …) |

**Tag count:** 103 rows in table above.

## Priority summary for lane editor MVP

| Priority | Tags |
|----------|------|
| **Must** | `lanes` (+ forward/backward/both_ways), `access:lanes` / `vehicle:lanes` / `bicycle:lanes`, `turn:lanes` (+ directional), `placement`, `width` / `width:lanes`, `lane_markings`, `cycleway:*`, `cycleway:lanes`, `oneway` |
| **Should** | `bus:lanes` / `lanes:psv`, `change:lanes`, `hgv:lanes`, `overtaking`, `destination:lanes`, `maxspeed:lanes`, `surface:lanes`, shoulders/sidewalks in cross-section, contraflow `oneway:*`, **separation/marking/traffic_mode family** (draft; Berlin/SRK critical), **`road_marking=*`** (junction/micromap editors — approved 2025) |
| **Nice** | conditional lanes, connectivity relation, `area:highway` junctions, experimental SRK tags (`lane_markings:junction`), full destination:*:lanes family, `cycleway:buffer`, motor-lane `separation:lanes`, **`road_marking` styling subtags**, pure-centreline v1 deferral of `road_marking` editing |

## Cross-project parser notes

- **osm2lanes** archived; logic in [osm2streets `lanes/classic.rs`](https://github.com/a-b-street/osm2streets/tree/main/osm2streets/src/lanes).
- **OsmLaneVisualizer** uses max `:lanes` pipe count vs `lanes` for QA.
- **Map Machine** (`--roads lanes`): width from `width` or `lanes`×3.7 m; draws geometric lane separators only — no `turn:lanes` / `*:lanes` access tags. See [`../projects/map-machine.md`](../projects/map-machine.md).
- **iD** — visual turn lane editor discussed 2016; lane editing planned per [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn) — **needs verification** for current iD support.

See `../00-sources-and-method.md` for full source list and wiki gaps.
