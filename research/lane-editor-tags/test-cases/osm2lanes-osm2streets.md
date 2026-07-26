# Adoptable test cases: osm2lanes + osm2streets

Inventory of regression fixtures suitable for adoption into a lane-editor test suite. Sources:

- **osm2lanes**: `data/tests.yml` (60 cases), `data/test_spec.py`
- **osm2streets**: `tests/src/*` (30 areas), `tests/README.md`

Priority for a **per-way lane editor**:

| Priority | Meaning |
|----------|---------|
| **high** | Direct tag → lane layout; core editor workflows |
| **med** | Real-world complexity, warnings, locale, or multi-tag interaction |
| **low** | Network geometry, transforms, or intersection topology (osm2streets); less about per-way tags |

---

## osm2lanes (`data/tests.yml`)

Path prefix: `https://github.com/a-b-street/osm2lanes/blob/main/data/tests.yml`

| ID | Source repo | Path | Description | Tags involved | Priority |
|----|-------------|------|-------------|-----------------|----------|
| osm2lanes-62176050 | osm2lanes | data/tests.yml | Great Northern Highway — 2-lane rural trunk (AU, LHT) | `highway=trunk`, `surface=asphalt` | med |
| osm2lanes-159276650 | osm2lanes | data/tests.yml | Alaska Highway — 2-lane rural trunk (CA-YT, RHT) | `highway=trunk`, `lanes=2`, `surface=paved` | med |
| osm2lanes-3981656 | osm2lanes | data/tests.yml | Tertiary road (GB) | `highway=tertiary` | med |
| osm2lanes-6537276 | osm2lanes | data/tests.yml | Dutch Autoweg 100 km/h | `highway=trunk`, `maxspeed=100`, `motorroad=yes` | med |
| osm2lanes-380103730 | osm2lanes | data/tests.yml | Japanese Expressway (oneway motorway) | `highway=motorway`, `lanes=2`, `oneway=yes`, `maxspeed=100`, `ref=E1A` | med |
| osm2lanes-560651884 | osm2lanes | data/tests.yml | Italian Autostrada — no shoulder | `highway=motorway`, `lanes=2`, `oneway=yes`, `surface=asphalt`, `toll=yes`, `maxspeed=110` | low |
| osm2lanes-240294912 | osm2lanes | data/tests.yml | Invalid `lanes:both_ways` value | `highway=primary`, `lanes=4`, `lanes:both_ways=2`, `sidewalk=both` | med |
| osm2lanes-102917976 | osm2lanes | data/tests.yml | Impossible speed limit + complex lane/turn tags | `highway=secondary`, `lanes=5`, `lanes:forward/backward/both_ways`, `cycleway=lane`, `bicycle=designated`, `turn:lanes:*`, `maxspeed=3025 mph` | med |
| osm2lanes-40297361 | osm2lanes | data/tests.yml | Steps (pedestrian) | `highway=steps` | low |
| osm2lanes-sidewalk-no | osm2lanes | data/tests.yml | `sidewalk=no` | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-sidewalk-none | osm2lanes | data/tests.yml | `sidewalk=none` (expect warnings) | `highway=road`, `lanes=1`, `oneway=yes`, `sidewalk=none` | high |
| osm2lanes-sidewalk-separate | osm2lanes | data/tests.yml | `sidewalk=separate` | `highway=road`, `lanes=1`, `oneway=yes`, `sidewalk=separate` | high |
| osm2lanes-sidewalk-both | osm2lanes | data/tests.yml | `sidewalk=both` | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=both` | high |
| osm2lanes-sidewalk-left-fwd | osm2lanes | data/tests.yml | `sidewalk=left` (forward, LHT) | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=left` | high |
| osm2lanes-sidewalk-right-fwd | osm2lanes | data/tests.yml | `sidewalk=right` (forward, RHT) | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=right` | high |
| osm2lanes-sidewalk-right-bwd | osm2lanes | data/tests.yml | `sidewalk=right` (backward, LHT) | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=right` | high |
| osm2lanes-sidewalk-both-yes | osm2lanes | data/tests.yml | `sidewalk:both=yes` | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk:both=yes` | high |
| osm2lanes-sidewalk-left-yes | osm2lanes | data/tests.yml | `sidewalk:left=yes` | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk:left=yes` | high |
| osm2lanes-sidewalk-right-yes | osm2lanes | data/tests.yml | `sidewalk:right=yes` | `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk:right=yes` | high |
| osm2lanes-cycleway-lane | osm2lanes | data/tests.yml | `cycleway=lane` (bidirectional road) | `cycleway=lane`, `highway=road`, `lanes=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-cycleway-lane-oneway | osm2lanes | data/tests.yml | `cycleway:left=lane` on oneway | `cycleway:left=lane`, `highway=road`, `lanes=2`, `oneway=yes`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-cycleway-forward-lane | osm2lanes | data/tests.yml | `cycleway:left=lane` (FORWARD side, LHT) | `cycleway:left=lane`, `highway=road`, `lanes=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-4188078 | osm2lanes | data/tests.yml | `cycleway:left=lane` on oneway primary | `cycleway:left=lane`, `highway=primary`, `lanes=2`, `oneway=yes`, `sidewalk=left` | high |
| osm2lanes-49207928 | osm2lanes | data/tests.yml | `cycleway:right=lane` (BACKWARD) | `cycleway:right=lane`, `highway=residential`, `sidewalk=both` | high |
| osm2lanes-428294122 | osm2lanes | data/tests.yml | Backward cycleway on oneway (forward side) | `cycleway:left=lane`, `bicycle=designated`, `highway=secondary`, `lanes=2`, `oneway=yes`, `sidewalk=both` | high |
| osm2lanes-534549104 | osm2lanes | data/tests.yml | Bidirectional cycleway on right | `cycleway:right:oneway=no`, `highway=tertiary`, `lanes=2`, `oneway=bicycle=no`, `sidewalk=both` | high |
| osm2lanes-cycleway-opposite-track | osm2lanes | data/tests.yml | Deprecated `cycleway=opposite_track` on oneway | `cycleway=opposite_track`, `highway=road`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=no` | med |
| osm2lanes-cycleway-opposite | osm2lanes | data/tests.yml | `cycleway=opposite` + `oneway:bicycle=no` | `cycleway=opposite`, `highway=road`, `oneway=bicycle=no`, `shoulder=no`, `sidewalk=no` | med |
| osm2lanes-25745877-advisory | osm2lanes | data/tests.yml | Advisory backward cycle lane on oneway | `cycleway:right=no`, `highway=residential`, `oneway=bicycle=no`, `shoulder=no`, `sidewalk=both` | med |
| osm2lanes-25745877-advisory-left | osm2lanes | data/tests.yml | Same + `cycleway:left:backward=yes` | `cycleway:right=no`, `highway=residential`, `oneway=bicycle=no`, `shoulder=no`, `sidewalk=both` | med |
| osm2lanes-276795234 | osm2lanes | data/tests.yml | Neukölln cycle path — complex access/lanes | `cycleway:right:width=1.3`, `highway=secondary`, `lanes:forward=1`, `bicycle=lanes:backward`, `parking:lane:both`, `placement:backward`, `turn:lanes:backward`, `vehicle=lanes:backward`, `width:lanes:forward`, `sidewalk:both=separate`, `maxspeed=50` | high |
| osm2lanes-busway-lane | osm2lanes | data/tests.yml | `busway=lane` | `busway=lane`, `highway=road`, `lanes=4`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-busway-both | osm2lanes | data/tests.yml | `busway:both=lane` | `busway=both:lane`, `highway=road`, `lanes=4`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-busway-forward | osm2lanes | data/tests.yml | `busway:right=lane` (FORWARD) | `busway=right:lane`, `highway=road`, `lanes=3`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-busway-backward | osm2lanes | data/tests.yml | `busway:right=lane` (BACKWARD) | `busway=right:lane`, `highway=road`, `lanes=3`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-busway-opposite | osm2lanes | data/tests.yml | Deprecated `busway=opposite_lane` | `busway=opposite_lane`, `highway=road`, `lanes=2`, `shoulder=no`, `sidewalk=no` | med |
| osm2lanes-bus-lanes | osm2lanes | data/tests.yml | `bus:lanes=designated\|\|` | `bus:lanes=designated\|\|`, `highway=road`, `lanes=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-psv-lanes | osm2lanes | data/tests.yml | `psv:lanes` (UK-style) | `psv:lanes=\|yes\|designated\|no`, `highway=road`, `lanes=4`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-bus-forward | osm2lanes | data/tests.yml | `bus:lanes:forward=designated\|` | `bus:lanes:forward=designated\|`, `highway=road`, `lanes:forward=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-bus-forward-hint | osm2lanes | data/tests.yml | Same with lane hint in description | `bus:lanes:forward=designated\|`, `highway=road`, `lanes:forward=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-bus-backward | osm2lanes | data/tests.yml | `bus:lanes:backward=designated` | `bus:lanes:backward=designated`, `highway=road`, `lanes=2`, `shoulder=no`, `sidewalk=no` | high |
| osm2lanes-988980354 | osm2lanes | data/tests.yml | NYC East 42nd St — `busway` + `lanes:bus` | `busway=lane`, `highway=primary`, `lanes:bus=2`, `sidewalk=both`, `maxspeed=25 mph`, `hgv=local` | high |
| osm2lanes-679636490 | osm2lanes | data/tests.yml | Mixing `lanes:bus` and `bus:lanes` | `bus:lanes:backward=yes`, `highway=secondary`, `lanes:forward=2`, `oneway=yes`, `access:lanes:backward=no`, `sidewalk=separate` | high |
| osm2lanes-201619353 | osm2lanes | data/tests.yml | Lambeth Bridge (London) | `bridge=yes`, `busway:left=lane`, `cycleway:right:width=1.25`, `highway=primary`, `hgv=no`, `parking:condition:both`, `sidewalk=no`, `maxspeed=20 mph` | med |
| osm2lanes-construction | osm2lanes | data/tests.yml | `highway=construction` | `construction=road`, `highway=construction`, `lanes=1`, `oneway=yes`, `shoulder=no`, `sidewalk=no` | med |
| osm2lanes-8591383-oneway-bicycle | osm2lanes | data/tests.yml | Bidirectional cycleway via `oneway:bicycle=no` | `cycleway:left=track`, `highway=tertiary`, `lanes=1`, `oneway=bicycle=no`, `sidewalk=both` | high |
| osm2lanes-8591383-left-oneway | osm2lanes | data/tests.yml | Bidirectional cycleway via `cycleway:left:oneway=no` | `cycleway:left:oneway=no`, `highway=tertiary`, `lanes=1`, `oneway=yes`, `sidewalk=both` | high |
| osm2lanes-353690151 | osm2lanes | data/tests.yml | Parking + bidirectional cycleway | `cycleway:right:oneway=no`, `highway=secondary`, `lanes=4`, `parking:lane:both=parallel`, `sidewalk=both` | high |
| osm2lanes-389654080 | osm2lanes | data/tests.yml | Centre turn lane + parking | `centre_turn_lane=yes`, `cycleway:right:oneway=no`, `highway=secondary`, `lanes=2`, `parking:lane:right=no_stopping`, `sidewalk=both` | high |
| osm2lanes-369623526 | osm2lanes | data/tests.yml | Opposite track + diagonal parking | `cycleway:left=opposite_track`, `highway=residential`, `lanes=1`, `oneway=bicycle=no`, `parking:lane:right=diagonal`, `sidewalk=both` | med |
| osm2lanes-777565028 | osm2lanes | data/tests.yml | Residential bidirectional | `highway=residential`, `oneway=no`, `sidewalk=both` | med |
| osm2lanes-224637155 | osm2lanes | data/tests.yml | Oneway primary sidewalk left | `highway=primary`, `lanes=2`, `oneway=yes`, `sidewalk=left` | med |
| osm2lanes-898731283 | osm2lanes | data/tests.yml | 3 generic lanes | `highway=road`, `lanes=3`, `sidewalk=both` | high |
| osm2lanes-5-lanes | osm2lanes | data/tests.yml | 5 generic lanes | `highway=road`, `lanes=5`, `sidewalk=no` | high |
| osm2lanes-lanes-backward | osm2lanes | data/tests.yml | `lanes:backward=1` | `highway=road`, `lanes:backward=1`, `sidewalk=no` | high |
| osm2lanes-335668924 | osm2lanes | data/tests.yml | Narrow alley `lanes=1` | `highway=service`, `lanes=1` | med |
| osm2lanes-13859146 | osm2lanes | data/tests.yml | French D986 busways both sides | `busway=both:lane`, `highway=secondary`, `lanes=4`, `maxspeed=50` | med |
| osm2lanes-84867915 | osm2lanes | data/tests.yml | Paris share_busway | `busway=right:lane`, `cycleway=right:share_busway`, `highway=secondary`, `lanes=2`, `oneway=yes`, `maxspeed=30` | high |
| osm2lanes-323605308 | osm2lanes | data/tests.yml | Nantes PSV + share_busway | `bus:lanes`, `busway=right:lane`, `cycleway=right:share_busway`, `highway=primary`, `lanes:psv=1`, `psv:lanes`, `taxi:lanes`, `oneway=yes` | high |
| osm2lanes-490351863 | osm2lanes | data/tests.yml | Berlin Kurfürstendamm PSV lanes | `cycleway=right:share_busway`, `highway=secondary`, `lanes:psv=1`, `psv:lanes`, `vehicle:lanes`, `turn:lanes`, `oneway=yes`, `sidewalk=right` | high |

**osm2lanes count: 60**

### Other osm2lanes fixtures

| ID | Source repo | Path | Description | Priority |
|----|-------------|------|-------------|----------|
| osm2lanes-spec-schema | osm2lanes | data/spec-lanes.json | JSON schema for expected lane output shape | high |
| osm2lanes-test-spec-py | osm2lanes | data/test_spec.py | Python validation against schema (not individual cases) | med |

### osm2lanes Rust unit tests (not in tests.yml)

Additional cases live in crate tests (e.g. `osm2lanes/src/transform/tags_to_lanes/modes/bicycle/cycleway.rs` `#[cfg(test)]`). These are **smaller tag snippets** for cycleway scheme logic — adoptable as micro-fixtures if round-trip coverage is needed.

---

## osm2streets (`tests/src/`)

Path prefix: `https://github.com/a-b-street/osm2streets/tree/main/tests/src`

Each area contains `input.osm`, `test.json` (notes), `geometry.json` (current output snapshot), and usually `boundary.json`.

| ID | Source repo | Path | Description | Tags / focus | Priority |
|----|-------------|------|-------------|--------------|----------|
| osm2streets-arizona_highways | osm2streets | tests/src/arizona_highways | Elaborate US motorways | Motorway tagging, unknown ideal output | low |
| osm2streets-aurora_sausage_link | osm2streets | tests/src/aurora_sausage_link | Dual carriageway median sausage link | Dual carriageway merge, median lane | low |
| osm2streets-borough_sausage_links | osm2streets | tests/src/borough_sausage_links | Many short London dual carriageways | `MergeDualCarriageways` | low |
| osm2streets-bristol_contraflow_cycleway | osm2streets | tests/src/bristol_contraflow_cycleway | Contraflow cycleway should merge into road | Contraflow cycleway, sidepath zip | med |
| osm2streets-bristol_sausage_links | osm2streets | tests/src/bristol_sausage_links | Dual carriageway for pedestrian island | Dual carriageway, crossing island | low |
| osm2streets-cycleway_rejoin_road | osm2streets | tests/src/cycleway_rejoin_road | Separate cycleway rejoins at intersection | Parallel cycleway geometry | med |
| osm2streets-degenerate_bug | osm2streets | tests/src/degenerate_bug | Loop road with internal degenerate intersections | `CollapseDegenerateIntersections` | low |
| osm2streets-frederiksted | osm2streets | tests/src/frederiksted | Frederiksted USVI — `.pbf` input | PBF import, LHT locale | low |
| osm2streets-fremantle_placement | osm2streets | tests/src/fremantle_placement | Many `placement:*` tags | `placement`, lane positioning | **high** |
| osm2streets-i5_exit_ramp | osm2streets | tests/src/i5_exit_ramp | Interstate exit ramp intersection geometry | Ramp/highway link geometry | low |
| osm2streets-kingsway_junction | osm2streets | tests/src/kingsway_junction | Over-complicated OSM vs satellite | Junction simplification | low |
| osm2streets-leeds_cycleway | osm2streets | tests/src/leeds_cycleway | Separate cycleway merges at several points | Parallel cycleway snap | med |
| osm2streets-montlake_roundabout | osm2streets | tests/src/montlake_roundabout | Roundabout → single junction geometry | `highway=roundabout`, junction geometry | low |
| osm2streets-neukolln | osm2streets | tests/src/neukolln | Compare to strassenraumkarte Berlin | Urban DE lane tagging (area) | med |
| osm2streets-northgate_dual_carriageway | osm2streets | tests/src/northgate_dual_carriageway | Bidirectional → dual carriageway block | Dual carriageway, branching | low |
| osm2streets-oneway_loop | osm2streets | tests/src/oneway_loop | One-way loop around square | Oneway loop topology | low |
| osm2streets-overlapping_service_roads | osm2streets | tests/src/overlapping_service_roads | Nearly overlapping service road loop | `highway=service` overlap | low |
| osm2streets-perth_peanut_roundabout | osm2streets | tests/src/perth_peanut_roundabout | Roundabout split entrance/exits | Roundabout geometry | low |
| osm2streets-perth_stretched_lights | osm2streets | tests/src/perth_stretched_lights | Stretched signalized intersection / dog-leg | Traffic signals, crossing ways | low |
| osm2streets-quad_intersection | osm2streets | tests/src/quad_intersection | Two dual carriageways → four internal junctions | `junction=intersection` internal roads | low |
| osm2streets-roosevelt_cycletrack | osm2streets | tests/src/roosevelt_cycletrack | Separate cycletrack, sparse connections | Parallel cycletrack | med |
| osm2streets-seattle_slip_lane | osm2streets | tests/src/seattle_slip_lane | Bike lane crosses right-turn slip lane | Bike lane + slip lane geometry | med |
| osm2streets-seattle_triangle | osm2streets | tests/src/seattle_triangle | Streets meet at triangle | Odd intersection geometry | low |
| osm2streets-service_road_loop | osm2streets | tests/src/service_road_loop | One-way service road loop | Service road topology | low |
| osm2streets-st_georges_cycletrack | osm2streets | tests/src/st_georges_cycletrack | Separate cycletrack, cycle-only connections | Cycle-only links | med |
| osm2streets-taipei | osm2streets | tests/src/taipei | 4 parallel ways + foot/cycle surrounds | Multi-way parallel tagging | med |
| osm2streets-tempe_light_rail | osm2streets | tests/src/tempe_light_rail | Light rail in dual carriageway intersection | Light rail, dual carriageway | low |
| osm2streets-tempe_split | osm2streets | tests/src/tempe_split | Road splits to dual carriageway, cautious `junction=intersection` | Dual carriageway split | low |
| osm2streets-tiny_loop | osm2streets | tests/src/tiny_loop | Loop street first/last point match | Loop topology | low |
| osm2streets-tiny_roundabout | osm2streets | tests/src/tiny_roundabout | `highway=roundabout` preserved | Roundabout way | low |

**osm2streets area count: 30**

### osm2streets in-crate tests

| ID | Source repo | Path | Description | Priority |
|----|-------------|------|-------------|----------|
| osm2streets-osm2lanes-tests | osm2streets | osm2lanes/src/tests.rs | Crate-level lane tests (may overlap muv_osm) | med |

---

## Summary counts

| Source | Fixture type | Count |
|--------|--------------|-------|
| osm2lanes | `tests.yml` cases | **60** |
| osm2lanes | `spec-lanes.json` + `test_spec.py` | 2 auxiliary |
| osm2streets | `tests/src/*` regression areas | **30** |
| **Total adoptable named cases** | | **90** (+ micro Rust tests) |

### Priority distribution (suggested)

| Priority | osm2lanes | osm2streets |
|----------|-----------|-------------|
| high | ~35 | 1 (`fremantle_placement`) |
| med | ~20 | 8 |
| low | ~5 | 21 |

---

## Adoption notes

1. **osm2lanes expected output** is lane arrays in `tests.yml` — directly portable for tag→lane assertions.
2. **osm2streets `geometry.json`** snapshots are *current implementation*, not gold standard (`tests/README.md`) — use for regression diffing or extract OSM + notes, not as canonical lane lists.
3. For per-way editor tests, prefer osm2lanes cases + individual ways extracted from osm2streets `input.osm`.
4. Locale: osm2lanes cases use `driving_side` and `ISO 3166-2` in fixture metadata, not on the way.
5. Active parser in osm2streets uses **muv_osm**; archived osm2lanes uses its own Rust parser — outputs may **diverge** for the same tags.
