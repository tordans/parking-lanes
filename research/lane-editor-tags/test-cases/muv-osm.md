# Adoptable test cases: muv-osm (LeLuxNet/Muv)

Inventory of inline Rust regression tests suitable for adoption into a lane-editor test suite. **Primary gold standard** for tag→lane layout when matching osm2streets / StreetExplorer behavior (see [projects/muv-osm.md](../projects/muv-osm.md)).

## 1. Source overview

| Item | Detail |
|------|--------|
| **Repository** | [LeLuxNet/Muv](https://gitlab.com/LeLuxNet/Muv) |
| **Crate path** | [`muv-osm/`](https://gitlab.com/LeLuxNet/Muv/-/tree/main/muv-osm) |
| **Entry point** | [`muv_osm::lanes::lanes()`](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/lanes.rs) |
| **Fixture format** | Inline `#[test]` functions with `new_tag! { … }` tag snippets — **no YAML/OSM files** |
| **License** | **MPL-2.0** |
| **Pinned revision** | [`5c473651`](https://gitlab.com/LeLuxNet/Muv/-/commit/5c4736510b505fd340f4b1a7962f3a1cf1c6a21d) (`main`, inspected **2026-07-25**) |
| **Lane-relevant tests** | **~50** `#[test]` in `muv-osm/src/lanes/**` |
| **Crate total** | **88** `#[test]` (remainder: units/number, conditional, access, hierarchy, lifecycle, parse, tags, serde, railway) |

Priority for a **per-way lane editor**:

| Priority | Meaning |
|----------|---------|
| **high** | Direct tag → lane layout; core editor workflows |
| **med** | Real-world complexity, locale defaults, multi-tag interaction, or defensive edge cases |
| **low** | Sanity limits, serde/unit plumbing, unimplemented stubs |

---

## 2. What we can take — priority table

Path prefix: `https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/`

| ID | Test fn | File | Tags involved | Why for lane editor | Priority |
|----|---------|------|---------------|---------------------|----------|
| muv-side-sidewalks | `sidewalks` | [highway/side_lanes.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/side_lanes.rs) | `sidewalk:both:surface`, `sidewalk:left=separate`, `sidewalk:right=yes` | Per-side sidewalk surface and separate vs on-way | med |
| muv-side-bus_bay | `bus_bay` | side_lanes.rs | `bus_bay=left`, `bus_bay:right=lane` | Side bus bay lanes | med |
| muv-side-cycleway_lane | `cycleway_lane` | side_lanes.rs | `cycleway=lane` | Default-side cycle lane on bidirectional road | high |
| muv-side-cycleway_lane_on_oneway | `cycleway_lane_on_oneway` | side_lanes.rs | `cycleway=lane` (+ oneway implied in test harness) | Cycle lane placement on oneway | high |
| muv-side-cycleway_opposite | `cycleway_opposite` | side_lanes.rs | `cycleway=opposite_track` | Deprecated contraflow track scheme | high |
| muv-side-cycleway_side_opposite | `cycleway_side_opposite` | side_lanes.rs | `cycleway:left=opposite_lane`, `cycleway:right=track` | Mixed explicit side cycleways | high |
| muv-side-cycleway_side_on_oneway | `cycleway_side_on_oneway` | side_lanes.rs | `cycleway:left=lane`, `cycleway:right=opposite_track` | Side cycleways on oneway | high |
| muv-side-cycleway_on_busway | `cycleway_on_busway` | side_lanes.rs | *(stub `todo!()`)* | **Skip** until implemented | low |
| muv-side-no_duplicate_cycleway_lanes | `no_duplicate_cycleway_lanes` | side_lanes.rs | `lanes:backward=2`, `cycleway:left/right=lane`, `cycleway:lanes:forward`, `vehicle:lanes:forward`, `bicycle:lanes:forward` | Side + on-carriageway cycle deduplication | **high** |
| muv-side-no_duplicate_bicycle_lanes | `no_duplicate_bicycle_lanes` | side_lanes.rs | `cycleway:left/right=lane`, `bicycle:lanes:forward` | `bicycle:lanes` vs side cycleway dedup | **high** |
| muv-side-no_duplicate_cycleway_lanes_on_oneway | `no_duplicate_cycleway_lanes_on_oneway` | side_lanes.rs | `oneway=yes`, `cycleway:right=lane`, `cycleway:lanes`, `vehicle:lanes`, `bicycle:lanes` | Middle bike lane on oneway without duplicate side lane | **high** |
| muv-side-cycleway_buffer | `cycleway_buffer` | side_lanes.rs | `cycleway:left/right`, `cycleway:*:buffer` | Separator buffer width lanes | med |
| muv-side-cycleway_segregated | `cycleway_segregated` | side_lanes.rs | `cycleway:left=opposite_track`, `cycleway:left:oneway=-1`, `foot/bicycle=designated`, `segregated=yes` | Segregated foot+cycle side track | med |
| muv-hwy-even_lane_count | `even_lane_count` | [highway/highway.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/highway.rs) | `highway=primary`, `lanes=4` | Basic even lane split | high |
| muv-hwy-odd_lane_count | `odd_lane_count` | highway.rs | `lanes=5`, `lanes:backward=2` | Odd count + directional split; centre lane bidirectional | high |
| muv-hwy-maxspeed_defaults | `maxspeed_defaults` | highway.rs | *(region defaults only — no way tags)* | Locale speed tables; not lane layout | low |
| muv-hwy-segregated | `segregated` | highway.rs | `highway=cycleway`, `oneway=yes`, `foot=permissive`, `segregated=yes` | Foot+cycle split on cycleway | med |
| muv-hwy-segregated_no_foot | `segregated_no_foot` | highway.rs | `highway=cycleway`, `segregated=yes` | Segregated cycleway without explicit foot tag | med |
| muv-hwy-segregated_sidewalk | `segregated_sidewalk` | highway.rs | `highway=cycleway`, `segregated=yes`, `sidewalk=left` | Sidewalk suppressed when segregated cycleway present | med |
| muv-hwy-unsegregated_sidewalk | `unsegregated_sidewalk` | highway.rs | `sidewalk=right`, `sidewalk:right:segregated=no`, `cycleway:right=track` | Combined foot+cycle on sidewalk side | med |
| muv-hwy-unsegregated_cycleway | `unsegregated_cycleway` | highway.rs | `cycleway:left:segregated=no`, `sidewalk=left` | Combined foot+cycle on cycleway side | med |
| muv-hwy-kerb | `kerb` | highway.rs | `lanes=2`, `sidewalk=both`, `parking:left=half_on_kerb` | Kerb indices with parking on kerb | **high** |
| muv-hwy-no_kerb | `no_kerb` | highway.rs | `highway=trunk` | No kerb on motorway-like default | med |
| muv-hwy-lane_widths | `lane_widths` | highway.rs | `width=8`, `vehicle:lanes:forward`, `bicycle:lanes:forward`, `parking:right=lane`, `parking:right:width=3` | Width distribution across travel + parking | **high** |
| muv-hwy-cycleway_with_cycleway | `cycleway_with_cycleway` | highway.rs | `highway=cycleway`, `cycleway=lane` | `cycleway=*` on dedicated cycleway way | med |
| muv-hwy-dont_skip_oneway_sidewalk | `dont_skip_oneway_sidewalk` | highway.rs | `sidewalk=left`, `sidewalk:left:oneway=-1`, `sidewalk:left:bicycle=yes` | Bidirectional sidewalk subtags | med |
| muv-hwy-busway_lanes_count | `busway_lanes_count` | highway.rs | `busway:left=lane`, `lanes=4` | Busway subtracted from lane count | **high** |
| muv-hwy-bus_lanes_ignore_busway | `bus_lanes_ignore_busway` | highway.rs | `busway:left=lane`, `bus:lanes:backward` | `bus:lanes` overrides co-located busway | **high** |
| muv-hwy-bus_lanes_count | `bus_lanes_count` | highway.rs | `lanes=4`, `lanes:bus:forward=1` | `lanes:bus` outer-lane masking | **high** |
| muv-hwy-busway_opposite_oneway | `busway_opposite_oneway` | highway.rs | `oneway=yes`, `oneway:bus=no`, `lanes:forward/backward` | Bus contraflow on oneway | **high** |
| muv-base-sidepath | `sidepath` | [highway/base.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/base.rs) | `sidewalk=both` | `is_sidepath` flag on sidewalk lanes | med |
| muv-base-sidewalk_sidepath | `sidewalk_sidepath` | base.rs | `highway=footway`, `footway=sidewalk` | Dedicated sidewalk way as sidepath | med |
| muv-base-cycleway_sidepath | `cycleway_sidepath` | base.rs | `highway=cycleway`, `is_sidepath=yes` | Dedicated cycleway sidepath | med |
| muv-base-cycleway_segregated_sidepath | `cycleway_segregated_sidepath` | base.rs | `cycleway:left=track`, `cycleway:left:segregated=yes` | Segregated sidepath pair | med |
| muv-base-no_duplicated_turns | `no_duplicated_turns` | base.rs | `turn:lanes=left\|right`, `oneway=yes`, `lanes=2` | Turn arrows not duplicated on sidepaths | high |
| muv-base-invalid_placement_backward | `invalid_placement_backward` | base.rs | `placement:backward=middle_of:2` (out of range) | Placement range clamping | med |
| muv-base-invalid_placement_forward | `invalid_placement_forward` | base.rs | `placement:forward=middle_of:2` (out of range) | Placement range clamping | med |
| muv-base-placement_forward | `placement_forward` | base.rs | `lanes=3`, `lanes:backward=2`, `placement:backward=middle_of:2` | Valid `placement:*` centre index | **high** |
| muv-travel-lanes_conditional | `lanes_conditional` | [travel.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/travel.rs) | `bus:lanes:forward/backward`, `bus:lanes:*:conditional` | Time-conditional bus lane access | med |
| muv-travel-maxspeed_type_above | `maxspeed_type_above` | travel.rs | `maxspeed:type=FR:rural`, `maxspeed=100` | Legal default caps HGV below way maxspeed | med |
| muv-travel-maxspeed_type_below | `maxspeed_type_below` | travel.rs | `highway=motorway`, `maxspeed=10` | Explicit maxspeed below legal default | med |
| muv-park-legacy_parking | `legacy_parking` | [parking.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/parking.rs) | `parking:lane:right=parallel`, `parking:lane:right:parallel=street_side`, `parking:condition:right:maxstay` | Legacy `parking:lane:*` schema | high |
| muv-park-parking | `parking` | parking.rs | `parking:left=lane`, `parking:left:orientation`, `parking:left:markings`, `parking:left:direction`, `parking:right=no` | Street parking schema v2 | high |
| muv-park-mixed_sides | `mixed_sides` | parking.rs | `parking:both=lane`, per-side `orientation` | Both-side parking with different orientations | high |
| muv-park-only_both | `only_both` | parking.rs | `parking:both=lane` | Minimal both-side parking | med |
| muv-park-only_both_legacy | `only_both_legacy` | parking.rs | `parking:lane:both=parallel` | Legacy both-side shorthand | med |
| muv-lanes-direction_lanes_limit | `direction_lanes_limit` | [lanes.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/lanes.rs) | `lanes=100` on motorway | `MAX_DIRECTION_LANES=20` cap | low |
| muv-lanes-global_lanes_limit | `global_lanes_limit` | lanes.rs | Pathological pipe counts on many lane keys | `MAX_LANES=120` cap | low |
| muv-oneway-layered_oneway | `layered_oneway` | [highway/oneway.rs](https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/oneway.rs) | `highway=cycleway`, `oneway=yes` | Bicycle designated on oneway cycleway | med |
| muv-oneway-roundabout | `roundabout` | oneway.rs | `junction=roundabout` | Roundabout implies vehicle oneway forward | med |

**Adoptable lane-relevant count: 50** (excludes `cycleway_on_busway` stub and non-layout `maxspeed_defaults`)

### Priority distribution

| Priority | Count |
|----------|-------|
| **high** | **22** |
| med | 24 |
| low | 4 |

---

## 3. Grouped by theme

### Counting (`lanes=*`, directional splits, busway subtraction)

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-hwy-even_lane_count | `even_lane_count` | `lanes=4` | high |
| muv-hwy-odd_lane_count | `odd_lane_count` | `lanes=5`, `lanes:backward=2` | high |
| muv-hwy-busway_lanes_count | `busway_lanes_count` | `busway:left=lane`, `lanes=4` | high |
| muv-lanes-direction_lanes_limit | `direction_lanes_limit` | `lanes=100` → capped at 20 | low |
| muv-lanes-global_lanes_limit | `global_lanes_limit` | many keys → capped at 120 | low |

### Bus schemes (`busway:*`, `bus:lanes`, `lanes:bus`, `oneway:bus`)

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-side-bus_bay | `bus_bay` | `bus_bay=left`, `bus_bay:right=lane` | med |
| muv-hwy-busway_lanes_count | `busway_lanes_count` | `busway:left=lane`, `lanes=4` | high |
| muv-hwy-bus_lanes_ignore_busway | `bus_lanes_ignore_busway` | `busway:left=lane`, `bus:lanes:backward` | high |
| muv-hwy-bus_lanes_count | `bus_lanes_count` | `lanes:bus:forward=1` | high |
| muv-hwy-busway_opposite_oneway | `busway_opposite_oneway` | `oneway:bus=no` on oneway | high |
| muv-travel-lanes_conditional | `lanes_conditional` | `bus:lanes:*:conditional` | med |

### Cycleway / middle bike lanes

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-side-cycleway_lane | `cycleway_lane` | `cycleway=lane` | high |
| muv-side-cycleway_lane_on_oneway | `cycleway_lane_on_oneway` | `cycleway=lane` on oneway | high |
| muv-side-cycleway_opposite | `cycleway_opposite` | `cycleway=opposite_track` | high |
| muv-side-cycleway_side_opposite | `cycleway_side_opposite` | `cycleway:left=opposite_lane`, `cycleway:right=track` | high |
| muv-side-cycleway_side_on_oneway | `cycleway_side_on_oneway` | mixed side cycleways on oneway | high |
| muv-side-no_duplicate_cycleway_lanes | `no_duplicate_cycleway_lanes` | side + `cycleway:lanes` + `bicycle:lanes` | **high** |
| muv-side-no_duplicate_bicycle_lanes | `no_duplicate_bicycle_lanes` | side + `bicycle:lanes` dedup | **high** |
| muv-side-no_duplicate_cycleway_lanes_on_oneway | `no_duplicate_cycleway_lanes_on_oneway` | middle bike on oneway | **high** |
| muv-side-cycleway_buffer | `cycleway_buffer` | `cycleway:*:buffer` | med |
| muv-side-cycleway_segregated | `cycleway_segregated` | segregated opposite track | med |
| muv-hwy-cycleway_with_cycleway | `cycleway_with_cycleway` | `highway=cycleway` + `cycleway=lane` | med |
| muv-hwy-segregated* / unsegregated* | `segregated`, `segregated_no_foot`, `segregated_sidewalk`, `unsegregated_sidewalk`, `unsegregated_cycleway` | `segregated=yes/no` interactions | med |
| muv-side-cycleway_on_busway | `cycleway_on_busway` | *(unimplemented)* | low |

### Placement (`placement:*`)

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-base-placement_forward | `placement_forward` | `placement:backward=middle_of:2` | **high** |
| muv-base-invalid_placement_backward | `invalid_placement_backward` | out-of-range `placement:backward` | med |
| muv-base-invalid_placement_forward | `invalid_placement_forward` | out-of-range `placement:forward` | med |

### Parking (`parking:*`, `parking:lane:*`)

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-park-legacy_parking | `legacy_parking` | `parking:lane:right=*` | high |
| muv-park-parking | `parking` | `parking:left/right` v2 | high |
| muv-park-mixed_sides | `mixed_sides` | `parking:both` + orientations | high |
| muv-park-only_both | `only_both` | `parking:both=lane` | med |
| muv-park-only_both_legacy | `only_both_legacy` | `parking:lane:both=parallel` | med |
| muv-hwy-kerb | `kerb` | `parking:left=half_on_kerb` + sidewalks | high |
| muv-hwy-lane_widths | `lane_widths` | `parking:right:width` in width split | high |

### Conditionals, speed, turns

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-travel-lanes_conditional | `lanes_conditional` | `bus:lanes:*:conditional` | med |
| muv-travel-maxspeed_type_above | `maxspeed_type_above` | `maxspeed:type` + HGV cap | med |
| muv-travel-maxspeed_type_below | `maxspeed_type_below` | explicit low `maxspeed` | med |
| muv-base-no_duplicated_turns | `no_duplicated_turns` | `turn:lanes=left\|right` | high |

### Sidewalks, sidepaths, oneway, limits

| ID | Test fn | Tags (summary) | Priority |
|----|---------|----------------|----------|
| muv-side-sidewalks | `sidewalks` | per-side sidewalk tags | med |
| muv-base-sidepath | `sidepath` | `is_sidepath` on `sidewalk=both` | med |
| muv-base-sidewalk_sidepath | `sidewalk_sidepath` | `footway=sidewalk` | med |
| muv-base-cycleway_sidepath | `cycleway_sidepath` | `is_sidepath=yes` | med |
| muv-hwy-dont_skip_oneway_sidewalk | `dont_skip_oneway_sidewalk` | `sidewalk:left:oneway=-1` | med |
| muv-oneway-layered_oneway | `layered_oneway` | cycleway oneway | med |
| muv-oneway-roundabout | `roundabout` | `junction=roundabout` | med |
| muv-hwy-no_kerb | `no_kerb` | trunk default — no kerb | med |
| muv-lanes-direction_lanes_limit | `direction_lanes_limit` | lane count cap | low |
| muv-lanes-global_lanes_limit | `global_lanes_limit` | global cap | low |

---

## 4. Commits worth watching

Lane-relevant history on [`muv-osm/src/lanes`](https://gitlab.com/api/v4/projects/LeLuxNet%2FMuv/repository/commits?ref_name=main&path=muv-osm/src/lanes) peaks around **Mar–May 2024** (osm2streets muv cutover, [PR #233](https://github.com/a-b-street/osm2streets/pull/233)). **Recent `main` activity (2025–2026) is mostly non-lane** (dependencies, Deutsche Bahn, pmtiles, wikibase).

| Date | SHA | Title |
|------|-----|-------|
| 2025-08-02 | [`2404d40b`](https://gitlab.com/LeLuxNet/Muv/-/commit/2404d40b) | Add range checks in placement calculations |
| 2025-06-06 | [`52949ce3`](https://gitlab.com/LeLuxNet/Muv/-/commit/52949ce3) | Use generic instead of impl in lanes function |
| 2024-05-07 | [`520dd0d0`](https://gitlab.com/LeLuxNet/Muv/-/commit/520dd0d0) | Skip cycleways when `bicycle:lanes:` is present |
| 2024-04-01 | — | `parking:both` fixes |
| 2024-03-12 | [`ef2033d1`](https://gitlab.com/LeLuxNet/Muv/-/commit/ef2033d1) | Add support for `lanes:bus` / `lanes:psv` |
| 2024-03 | — | Cycleway oneway / segregated / busway fixes (PR #233 era) |

**Monitoring links:**

- [Commits API — `muv-osm/src/lanes`](https://gitlab.com/api/v4/projects/LeLuxNet%2FMuv/repository/commits?ref_name=main&path=muv-osm/src/lanes)
- [Commits page — `main`](https://gitlab.com/LeLuxNet/Muv/-/commits/main)

---

## 5. What NOT to take as gold

| Category | Location | Why skip for lane-editor fixtures |
|----------|----------|-----------------------------------|
| Number/unit parsing | `muv-osm/src/units/**`, `number.rs` | Not lane layout |
| Serde round-trip | `travel.rs` `serde` test | Serialization plumbing |
| Tag macro / hierarchy | `tags.rs`, `hierarchy.rs`, `parse.rs` | Infrastructure, not lane semantics |
| Access parser unit tests | `access.rs` | Mode access in isolation |
| Conditional parser | `conditional.rs` | Opening-hours syntax only |
| Lifecycle | `lifecycle.rs` | Construction/abandoned — out of initial editor scope |
| Railway | `lanes/railway/**` | Unless editor scopes light rail / tram |
| `maxspeed_defaults` | `highway.rs` | Region table lookup, no way tags |
| `cycleway_on_busway` | `side_lanes.rs` | `todo!()` — not implemented |
| Fuzz / bench | `muv-osm/fuzz/`, `benches/` | Invariant/perf, not named fixtures |

---

## 6. Adoption recipe

1. **Extract tags** — Copy the `new_tag! { … }` block from the Rust test into our fixture format (flat key→value map + optional `region` / `driving_side` from the test’s `&["DE"]` argument).

2. **Choose assertion target:**
   - **Direct:** `muv_osm::lanes::lanes(&tags, &[region])` → assert `lanes.len()`, `centre`, `centre_line`, `kerb_left`/`kerb_right`, per-lane access/width.
   - **Downstream:** osm2streets `get_lane_specs_ltr()` (via `osm2lanes/src/algorithm.rs`) when matching StreetExplorer / lane editor preview.

3. **Do NOT assert archived osm2lanes JSON** — Outputs diverge on cycleway oneway defaults, `oneway:bicycle`, `segregated`, separators, and warnings. Re-assert against muv instead.

4. **Pin dependency** — Use Git rev `5c473651` (or newer lane-path commit) in `Cargo.toml` for reproducible CI:
   ```toml
   muv-osm = { git = "https://gitlab.com/LeLuxNet/Muv", rev = "5c4736510b505fd340f4b1a7962f3a1cf1c6a21d", features = ["serde", "lanes"] }
   ```

5. **Region metadata** — Tests pass ISO 3166-1/2 codes (`DE`, `US`, `GB`, …) as the second argument; include in fixture metadata, not on the way.

6. **Companion downstream suite** — Cross-check with osm2streets [`osm2lanes/src/tests.rs`](https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/tests.rs) (~27 ASCII lane-type specs). Some cases are commented out post-muv; treat muv inline tests as authoritative when they disagree.

---

## 7. Related inventories

| Source | File | Relationship |
|--------|------|--------------|
| **muv-osm (this file)** | [muv-osm.md](./muv-osm.md) | **Primary** — active parser gold standard |
| osm2streets `tests.rs` | [osm2lanes-osm2streets.md](./osm2lanes-osm2streets.md) § osm2streets in-crate | Downstream companion (~27 cases) |
| Archived osm2lanes | [osm2lanes-osm2streets.md](./osm2lanes-osm2streets.md) | Secondary tag coverage; re-assert via muv |
| StreetComplete CyclewayParser | [_streetcomplete-cycleway-parser.md](../projects/_streetcomplete-cycleway-parser.md) | `cycleway:*` read-only; 215+ tests |

**See also:** [projects/muv-osm.md](../projects/muv-osm.md) — full tag interpretation reference.
