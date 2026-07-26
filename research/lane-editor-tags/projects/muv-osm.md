# muv_osm (muv-osm)

Research snapshot for [LeLuxNet/Muv](https://gitlab.com/LeLuxNet/Muv) crate **`muv-osm`** (Rust import `muv_osm`). Sources: Muv README, `muv-osm/Cargo.toml`, `muv-osm/src/lanes/**`, [rustdoc](https://leluxnet.gitlab.io/Muv/muv_osm/), [osm2streets PR #233](https://github.com/a-b-street/osm2streets/pull/233), osm2streets `osm2lanes/src/algorithm.rs`. Fetched **2026-07-25**.

**See also:** [osm2streets.md](./osm2streets.md) (integration layer), [osm2lanes.md](./osm2lanes.md) (archived predecessor), [test-cases/osm2lanes-osm2streets.md](../test-cases/osm2lanes-osm2streets.md).

## 1. Project overview

**Muv** is a GitLab monorepo of geo/transit libraries maintained by [LeLuxNet](https://gitlab.com/LeLuxNet). **`muv-osm`** is its OSM tag parser; lane extraction is the flagship feature exposed as `muv_osm::lanes::lanes()`.

| Item | Detail |
|------|--------|
| **Role** | Per-way OSM tags → structured `Lanes` (left-to-right `Lane` list, centre-line index, kerb indices, lifecycle) |
| **Consumers** | [Muv App](https://gitlab.com/LeLuxNet/Muv-App) (in development); **[osm2streets](https://github.com/a-b-street/osm2streets)** since [PR #233](https://github.com/a-b-street/osm2streets/pull/233) (merged 2024-03-13) |
| **osm2streets integration** | `osm2lanes/src/algorithm.rs` calls `muv_osm::lanes::lanes(&tags, &[country])`, then maps `Lane` / `AccessLevel` / `TMode` → osm2streets `LaneSpec` / `LaneType` |
| **Replaces** | In-repo archived osm2lanes tag→lane algorithm (scheme-based `RoadBuilder`); translation layer in osm2streets remains for rendering types |
| **Output model** | Rich per-lane `TravelLane` (bidirectional access/turn/speed per mode) or `ParkingLane`; placement as `centre` / `centre_line` lane indices |
| **Locale** | ISO 3166-1/2 region codes → driving side (`driving_side.rs`), default speeds (`lanes-default-speeds` feature), cyclestreet rules |

## 2. Repository confirmation

| Field | Value |
|-------|-------|
| **GitLab** | https://gitlab.com/LeLuxNet/Muv |
| **Crate path** | `muv-osm/` (workspace member) |
| **Rust crate name** | `muv-osm` (import `muv_osm`) |
| **Version** | `0.1.0` (per `muv-osm/Cargo.toml` on `main`) |
| **License** | **MPL-2.0** (Muv README: all libraries except `muv-transit-ticket` which is GPL-3.0+) |
| **crates.io** | **Not published** — osm2streets depends via Git: `muv-osm = { git = "https://gitlab.com/LeLuxNet/Muv", features = ["serde", "lanes"] }` |
| **Docs** | https://leluxnet.gitlab.io/Muv/muv_osm/ |
| **Related crates** | `muv-osm-derive`, `muv-osm-pbf`, `muv-geo`, `muv-cli`, … |
| **WASM** | Optional `wasm-bindgen` feature exports `lanes(tags)` (defaults region `DE` in `js_lanes`) |

## 3. Tags interpreted

Tags are read via the `get_tag!` macro (hierarchical key trees) and `TMode::iter_tags` (any key matching a transport mode, e.g. `bus:lanes:forward`). Conditional values use the `conditional` feature (`@` opening-hours syntax).

**Table: 63 tag keys / families** (grouped; `:forward` / `:backward` / `:both_ways` suffixes apply where noted).

| Tag / family | Role | Interpretation (muv-osm) | Source |
|--------------|------|---------------------------|--------|
| `highway=*` | Road class | Selects `highway_lanes()`; sets default access, implied oneway for motorway/roundabout | `lanes/highway/class.rs`, `highway.rs` |
| `highway=construction` + `construction=*` | Lifecycle | `Lifecycle::from_osm` → construction lanes | `lifecycle.rs` |
| `abandoned=*`, `razed:highway=*` | Lifecycle | Disused/razed lifecycle handling | `lifecycle.rs` |
| `oneway=*` | Direction | Vehicle default; mode-specific `oneway:{mode}` via `parse_oneway` | `lanes/highway/oneway.rs` |
| `oneway:bus`, `oneway:bicycle`, … | Direction | Per-mode oneway merged into lane access | `oneway.rs`, `TMode` |
| `oneway=reversible` / `alternating` | Direction | Treated as no travel when schedule unknown (safe default) | PR #233 discussion; `oneway.rs` |
| `junction=roundabout\|circular` | Direction | Implies vehicle oneway forward | `oneway.rs` |
| `driving_side=left\|right` | Locale | Overrides region-derived side | `highway.rs` |
| *(region code argument)* | Locale | ISO 3166-1/2 → LHT/RHT when `driving_side` absent | `driving_side.rs` |
| `motorroad=yes` | Access default | Motorway-like default access | `class.rs` |
| `bicycle_road=yes`, `cyclestreet=yes` | Access default | Region-specific cyclestreet access | `access.rs` |
| `lanes=N` | Lane count | Total motor lanes; caps at 20 per direction / 120 total | `base.rs`, `lanes.rs` |
| `lanes:forward`, `lanes:backward` | Lane count | Directional counts; interact with `lanes` and busway subtraction | `base.rs` |
| `lanes:both_ways=N` | Lane count | Centre bidirectional lanes (shared turn / contraflow) | `base.rs` |
| `lanes:bus[:direction]=N` | Bus counting | Masks outer N lanes as bus-designated if no `bus:lanes` override | `direction.rs` `mask_outer(..., Bus, "bus")` |
| `lanes:psv[:direction]=N` | PSV counting | Same for `TMode::Psv` | `direction.rs` `mask_outer(..., Psv, "psv")` |
| `placement=*` | Geometry | `transition`, `middle_of:N`, `right_of:N`, `left_of:N` → centre index | `placement.rs`, `base.rs` |
| `placement:forward`, `placement:backward` | Geometry | Directional placement on two-way roads | `base.rs` |
| `centre_turn_lane=yes` / `center_turn_lane=yes` | Turn lane | Adds centre bidirectional lane with U-turn toward driving side | `base.rs` |
| `priority=forward\|backward` | Lane count | Default single-lane bias when `lanes` absent | `base.rs` |
| `width`, `est_width` | Width | Carriageway width; distributed across lanes without explicit width | `highway.rs`, `base.rs` |
| `carriageway=*` | Width | Physical carriageway width (with `width:` tree) | `highway.rs` |
| `width:lanes` (+ `:forward`/`:backward`) | Width | Per-lane widths (`\|` separated) | `direction.rs` |
| `access=*` | Access | Global access merged into lane defaults | `direction.rs` `AllParser::access` |
| `access:lanes` (+ dirs) | Access | Per-lane pipe-separated access per mode | `direction.rs`, `travel.rs` |
| `{mode}:lanes` | Access | Any `TMode` key (`vehicle`, `bicycle`, `bus`, `psv`, `hgv`, …) | `tmode.rs`, `direction.rs` |
| `{mode}:lanes:conditional` | Access | Conditional per-lane access | `travel.rs` tests |
| `turn:lanes` (+ dirs) | Turn | Pipe-separated `Turn` bitflags per lane | `travel.rs`, `direction.rs` |
| `change:lanes` (+ dirs) | Lane change | `yes`, `no`, `not_left`, `only_right`, … per lane | `travel.rs` |
| `overtaking:lanes` (+ dirs) | Overtaking | Per-lane overtaking rules | `direction.rs` |
| `priority_road:lanes` (+ dirs) | Priority | Per-lane priority road marking | `direction.rs` |
| `maxspeed`, `maxspeed:{mode}` | Speed | Lane and mode-specific limits | `direction.rs` |
| `maxspeed:lanes`, `minspeed:lanes` (+ dirs) | Speed | Per-lane speeds | `direction.rs` |
| `maxspeed:type`, `source:maxspeed` | Speed | Legal default integration (`lanes-default-speeds`) | `travel.rs` |
| `surface`, `smoothness` | Surface | Way or `:lanes` per-lane | `direction.rs` |
| `surface:lanes`, `smoothness:lanes` (+ dirs) | Surface | Per-lane | `direction.rs` |
| `maxweight:lanes`, `maxheight:lanes`, … | Vehicle limits | Per-lane dimensional restrictions | `direction.rs` |
| `sidewalk=*` | Sidewalk | `both`/`left`/`right`/`yes` → footway side lanes; `separate` → none on way | `side_lanes.rs` |
| `sidewalk:{side}=*` | Sidewalk | Per-side yes/separate + subtags (`surface`, `oneway`, `bicycle`, …) | `side_lanes.rs`, tests |
| `footway=sidewalk` | Sidewalk | Marks footway lane as sidepath | `base.rs` |
| `is_sidepath=yes` | Sidepath | Lane flagged `is_sidepath` (affects osm2streets sidewalk type) | `base.rs` |
| `cycleway=*` | Cycleway (side) | `lane`, `track`, `opposite_*`, `share_busway` → side `SideLane` | `side_lanes.rs` |
| `cycleway:left/right/both` | Cycleway (side) | Side-specific; `both` duplicates to left+right | `side_lanes.rs` |
| `cycleway:*:oneway` | Cycleway dir. | Overrides default oneway (side lanes default oneway **yes**) | `side_lanes.rs`, PR #233 |
| `cycleway:*:buffer` | Separator | Inserts width-only buffer lane | `side_lanes.rs` |
| `cycleway:*:segregated` | Segregated | Foot+cycle split; interacts with `sidewalk:*` | `highway.rs`, `side_lanes.rs` |
| `cycleway:lanes` (+ dirs) | On-carriageway cycle | Pipe positions; deduped against side `cycleway:*` | `side_lanes.rs`, `highway.rs` tests |
| `bicycle:lanes` (+ dirs) | On-carriageway cycle | Passed as `bicycle_lanes_tags` for side-lane deduplication | `highway.rs` |
| `busway=*` | Bus side lane | `lane`, `opposite_lane` → busway `SideLane` | `side_lanes.rs` |
| `busway:left/right/both` | Bus side lane | Same; `both` on oneway → one side per driving side (PR #233) | `side_lanes.rs`, PR #233 |
| `busway:*:lanes` | Bus side lane | Lane-count hints on busway subtree | `side_lanes.rs` |
| `bus:lanes` (+ dirs) | Bus access | Per-lane bus access; suppresses conflicting `busway:*` | `highway.rs`, `direction.rs` |
| `psv:lanes` (+ dirs) | PSV access | Per-lane PSV; interacts with `bus:lanes` / `lanes:psv` | `direction.rs` |
| `bus_bay=*` | Bus bay | Side bus bay lanes (`yes`, `left`, `right`, `lane`) | `side_lanes.rs` |
| `parking:lane:{side}` | Parking (legacy) | Street-side parking schema v1 | `parking.rs` |
| `parking:{side}`, `parking:both` | Parking | Street parking schema v2 (`lane`, orientations, restrictions) | `parking.rs` |
| `parking:*:orientation` | Parking | `parallel`, `diagonal`, `perpendicular` | `parking.rs` |
| `parking:*:capacity`, `:zone`, `:condition:` | Parking | Capacity, zones, conditional maxstay | `parking.rs` |
| `shoulder=*` | Shoulder | `yes`/`both`/`left`/`right` shoulder side lanes | `side_lanes.rs` |
| `segregated=yes/no` | Foot+cycle | On `highway=cycleway` / footway: splits foot and bicycle | `highway.rs` |
| `public_transport=platform` | Platform | Affects lane platform access filtering | `highway.rs` |
| `railway=*` | Rail | Separate `railway_lanes()` path (light rail, rail, tram tags in railway module) | `lanes/railway/` |
| `foot`, `bicycle` (way-level) | Access | Cascade into defaults when no `:lanes` override | `access.rs` |

Modes recognized for `:lanes` keys include (non-exhaustive): `vehicle`, `motorcar`, `bicycle`, `foot`, `bus`, `psv`, `taxi`, `hgv`, `hov`, `emergency`, ski/hazmat subtrees — see `TMode` in `tmode.rs`.

### Lanes counting (detail)

- **Default** with no `lanes`: 2 motor lanes (1 forward + 1 backward), except oneway merge cases (`base.rs`).
- **`lanes:N`** sets total; split with `lanes:forward` / `lanes:backward` / `lanes:both_ways`.
- **Busways**: `busway:*=lane` reserves forward/backward slots subtracted from `lanes` count before splitting (`highway.rs`).
- **`lanes:bus` / `lanes:psv`**: designate outer N lanes per direction without full `bus:lanes` pipe strings (`mask_outer`).
- **Limits**: `MAX_DIRECTION_LANES = 20`, `MAX_LANES = 120` (`lanes.rs`).

### Bus / PSV (detail)

| Scheme | Behavior |
|--------|----------|
| `busway:*` | Physical side bus lanes outside carriageway |
| `bus:lanes=*\|…` | Per-lane bus access; overrides co-located `busway:*` when both present |
| `lanes:bus[:forward\|:backward]=N` | Added in PR #233; outer N lanes bus-designated |
| `lanes:psv` | Same pattern for PSV |
| `oneway:bus=no` | Allows bus contraflow on split forward/backward lanes | `highway.rs` test `busway_opposite_oneway` |
| `share_busway` | Parsed as normal cycle **lane** sidepath; **TODO** merge into bus lane (PR #233 comment) |

### Cycleways (detail)

| Pattern | Behavior |
|---------|----------|
| `cycleway=lane` / `track` | Side lane on driving side (RHT → right) |
| `cycleway:left/right/both` | Explicit side; `both` duplicates |
| `opposite_lane`, `opposite_track`, `opposite_share_busway` | Contraflow side on opposite side |
| `cycleway:*:oneway=no` | Bidirectional side track (preferred over bare `oneway:bicycle=no` on parent) |
| `cycleway:lanes` | In-carriageway positions; dedupes against side cycleways |
| **Middle cycleway** | No `cycleway:middle` key; middle positions via `cycleway:lanes` / `bicycle:lanes` pipe slots only |
| `share_busway` | Treated as cycle lane (not merged with bus yet) |

**PR #233 defaults (cycleway oneway):** `cycleway:{left,right}=track` defaults to **oneway** per side (not wiki’s ambiguous bidirectional default). `oneway:bicycle=no` on parent applies to **centreline** only, not pulled into side cycleways (creates single shared bike+car lane, not duplicate track).

### Turn lanes (detail)

- `turn:lanes`, `turn:lanes:forward`, `turn:lanes:backward`: pipe-separated, per `Turn` enum (`through`, `left`, `merge_to_left`, `reverse`, …).
- `centre_turn_lane=yes`: synthetic centre bidirectional lane with turn restriction.
- Tests guard against duplicated turn parsing on sidepaths (`base.rs` `no_duplicated_turns`).

### Placement (detail)

- Values: `transition`, `middle_of:N`, `right_of:N`, `left_of:N` (`placement.rs`).
- `placement:forward` / `placement:backward` adjust `centre` index on two-way roads (`base.rs`).
- Lane indices in placement are **1-based** from left in way direction.

### Access `:lanes` family (detail)

- Generic: any `TMode` + `:lanes` + optional `:forward`/`:backward`/`:both_ways`.
- Parsed by `IndividualParser::access` / `direction_conditional`; supports `:conditional` suffix.
- `access:lanes` uses same machinery as `vehicle:lanes`, `bicycle:lanes`, etc.

### Parking (detail)

- Supports **street parking** schema (`parking:left/right/both`) and legacy `parking:lane:*`.
- Positions: `lane`, `on_street`, `half_on_kerb`, `on_kerb`, `shoulder`, …
- Orientations: parallel / diagonal / perpendicular; restrictions `no_parking`, `no_stopping`, loading-only, etc.

### Sidewalks (detail)

- `sidewalk=both|left|right|yes` → foot-designated travel lanes with kerb.
- `sidewalk=separate` or `sidewalk:{side}=separate` → no on-way sidewalk lane.
- When both sidewalk and cycleway claim same side, `segregated` on one suppresses the other (`highway.rs`).
- osm2streets may **infer** `sidewalk=*` before calling muv (`algorithm.rs` `infer_sidewalk_tags`) — not part of muv itself.

### Width / buffer (detail)

Width-only behaviour (see also [width-measurements](../../width-measurements/)):

| Mechanism | Code | Notes |
|-----------|------|-------|
| Carriageway total | `carriageway_width()` in `highway.rs` | Prefers `width:carriageway` under `width:` tree, else `width`, else `est_width` |
| Distribute leftover | `distribute_full_width` in `base.rs` | Subtracts lanes that already have `lane.width`; splits remainder by weight across unset lanes |
| Per-lane override | `width:lanes` via `direction.rs` | Sets `lane.width` directly |
| Cycle buffer | `add_buffer` in `side_lanes.rs` | Numeric `cycleway:*:buffer` → extra lane with only `width` set; `yes`/`no` ignored for metres |
| Paint / gutters | — | **Not modelled** — no millimetre paint attribution |

Regression anchors: `lane_widths` (`width=8` + `parking:right:width=3`), `cycleway_buffer` (`0.2` / `0.75`).

## 4. Comparison vs archived osm2lanes (PR #233)

| Topic | Archived osm2lanes | muv-osm (post-#233) |
|-------|-------------------|---------------------|
| **Architecture** | `osm-tag-schemes` + inside-out `RoadBuilder` | Single `highway_lanes()` pipeline, rich `TravelLane` per lane |
| **Output** | `travel` / `parking` / `separator` JSON schema | `LaneVariant::Travel\|Parking` + placement indices |
| **Separators** | Explicit separator lanes (inferred paint) | Kerb indices + cycleway `buffer` width lanes; markings not modeled |
| **Round-trip tags** | `lanes_to_tags` goal | Not a design goal |
| **Warnings** | User-visible parser warnings | Limited; PR suggests adding warning list (dabreegster, #233) |
| **`lanes:bus` / `lanes:psv`** | Partial | Explicit support added during PR (#233, 2024-03-12) |
| **Cycleway oneway defaults** | Wiki-aligned bidirectional `track` in some tests | Side `track`/`lane` default **oneway**; disputed cases ignored/commented in tests |
| **`oneway:bicycle=no`** | Could imply bidirectional side track | Applies to centreline only; `cycleway:left:oneway=no` preferred |
| **`share_busway`** | Partial | Still TODO (separate cycle lane) |
| **`segregated=no` on cycleway** | Two foot+cycle lanes | One combined lane (test case way/539534598 ignored in #233) |
| **Placement** | Limited in archived crate | Full `placement:*` family |
| **Conditional access** | Some | Full opening-hours conditionals (`conditional` feature) |
| **Parallel ways** | Explicitly out of scope | Still per-way only |
| **Test suite** | `data/tests.yml` (60 cases) | Inline Rust tests + osm2streets `osm2lanes/src/tests.rs` |

**PR #233 merge rationale:** Large visual/regression improvements; remaining disagreements accepted or test-ignored; bugs fixed upstream in muv with `cargo update muv-osm` (ginnyTheCat, 2024-03-13).

## 5. Test cases / fixtures in Muv repo

**No standalone fixture files** (`tests.yml`, `.osm`, `.json`) in `muv-osm/`. Tests are inline `#[test]` functions and integration with osm2streets.

**Full adoptable inventory:** [test-cases/muv-osm.md](../test-cases/muv-osm.md) — ~50 lane-relevant cases with tags, priorities, and adoption recipe. Commits inspected **2026-07-25** (pinned rev `5c473651` on `main`); recent `main` commits are mostly non-lane (deps, Deutsche Bahn, pmtiles).

| Path | Name / kind | Count | Notes |
|------|-------------|-------|-------|
| `muv-osm/src/**/*.rs` | Inline unit tests | **88** `#[test]` | Tag snippets in `new_tag! { … }` |
| `muv-osm/src/lanes/highway/side_lanes.rs` | Side-lane tests | 13 | Sidewalk, cycleway, bus_bay, buffer, segregated |
| `muv-osm/src/lanes/highway/highway.rs` | Integration tests | 17 | Kerb, bus lanes, widths, segregated |
| `muv-osm/src/lanes/highway/base.rs` | Placement tests | 8 | `placement:forward/backward` |
| `muv-osm/src/lanes/travel.rs` | Conditional lanes | 4 | `bus:lanes:conditional`, maxspeed |
| `muv-osm/src/lanes/parking.rs` | Parking tests | 5 | Legacy + street parking schemas |
| `muv-osm/fuzz/fuzz_targets/lanes.rs` | Fuzz target | 1 | Arbitrary tags → `lanes()` invariant |
| `muv-osm/benches/lanes.rs` | Benchmark | 1 | Criterion bench |
| `muv-osm/test-osm2streets.sh` | Integration script | 1 | Temporarily patches osm2streets `Cargo.toml`, runs `cargo test` in `osm2lanes/` |

**Downstream tests exercising muv (not in Muv repo):**

| Path | Count | Notes |
|------|-------|-------|
| [osm2streets/osm2lanes/src/tests.rs](https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/tests.rs) | ~27 OSM way spec cases | ASCII lane-type + direction strings; companion suite — see inventory §7 |
| [osm2streets/tests/src/*](https://github.com/a-b-street/osm2streets/tree/main/tests/src) | 30 areas | Network geometry; not muv unit fixtures |

## 6. UX / tools

| Tool | URL | Role |
|------|-----|------|
| **Muv osm2streets demo** | https://muv.lelux.net/osm2streets | StreetExplorer-style preview on muv branch (PR #233) |
| **Older demo** | https://muv.lelux.net/osm2streets-demo | Pre-merge comparison (PR #233) |
| **StreetExplorer** | https://a-b-street.github.io/osm2streets/ | Production osm2streets UI (post-merge muv) |
| **Lane editor** | https://a-b-street.github.io/osm2streets/lane_editor.html | Tag edit → lane preview via osm2streets-js |
| **rustdoc** | https://leluxnet.gitlab.io/Muv/muv_osm/ | API reference, `lanes()` example |
| **taginfo helper** | `muv-osm/dev_taginfo_lanes.sh` | Queries taginfo for lane-related key families |

## 7. Editor implications

### Gold-standard recommendation

**Treat `muv_osm` (via osm2streets `get_lane_specs_ltr`) as the primary gold standard** for a lane editor that aims to match StreetExplorer / osm2streets preview behavior.

| Source | Use as gold standard? | Rationale |
|--------|----------------------|-----------|
| **muv_osm inline tests + osm2streets `osm2lanes/src/tests.rs`** | **Yes — primary** | Active parser path; PR #233 explicitly migrated regression intent here |
| **osm2streets `tests/src/*` geometry snapshots** | No (regression only) | Network transforms; snapshots are implementation-dependent per `tests/README.md` |
| **Archived osm2lanes `data/tests.yml`** | Secondary inventory | Excellent tag coverage and expected lane JSON, but outputs **diverge** on cycleway oneway, `oneway:bicycle`, `segregated`, separators, and warnings |
| **OsmLaneVisualizer / Straßenraumkarte** | Tertiary / cross-check | Different assumptions (e.g. Berlin `cycleway:lanes`, placement defaults) |

**Practical test strategy:**

1. Port **muv-relevant** cases from archived `tests.yml` by re-asserting against `muv_osm::lanes()` or osm2streets `get_lane_specs_ltr`, not archived JSON.
2. Add osm2streets `tests.rs` ASCII specs for editor smoke tests.
3. Keep archived YAML cases flagged where muv intentionally differs (cycleway defaults, commented cases in `tests.rs`).
4. For sidewalk preview, test with and without osm2streets `MapConfig.inferred_sidewalks`.

## 8. Source index

| Resource | URL |
|----------|-----|
| Muv repository | https://gitlab.com/LeLuxNet/Muv |
| Muv README | https://gitlab.com/LeLuxNet/Muv/-/blob/main/README.md |
| muv-osm Cargo.toml | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/Cargo.toml |
| muv_osm rustdoc | https://leluxnet.gitlab.io/Muv/muv_osm/ |
| `lanes()` entry | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/lanes.rs |
| Highway lane algorithm | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/highway.rs |
| Side lanes (cycle/bus/sidewalk) | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/side_lanes.rs |
| Placement | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/highway/placement.rs |
| Parking | https://gitlab.com/LeLuxNet/Muv/-/blob/main/muv-osm/src/lanes/parking.rs |
| osm2streets PR #233 | https://github.com/a-b-street/osm2streets/pull/233 |
| osm2streets algorithm bridge | https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/algorithm.rs |
| osm2streets osm2lanes tests | https://github.com/a-b-street/osm2streets/blob/main/osm2lanes/src/tests.rs |
| Muv demo | https://muv.lelux.net/osm2streets |

## 9. Open questions for human confirmation

1. **crates.io publishing** — Will `muv-osm` be published, or remain Git-only? Affects editor WASM dependency strategy.
2. **`cycleway:middle` / middle-only keys** — Not found in muv source; confirm no planned support vs `cycleway:lanes` only.
3. **`share_busway` merge semantics** — PR #233 left as TODO; status on `main` today?
4. **`oneway:bicycle` + `cycleway:track` wiki mismatch** — Community consensus still open (tordans, matkoniecz, ginnyTheCat, #233); muv default may change.
5. **`segregated=no` on `highway=cycleway`** — Single vs dual lane; test still ignored in osm2streets?
6. **Warning surface** — muv does not expose warnings like archived osm2lanes; will osm2streets lane editor need a warning API?
7. **Tram / `railway=tram`** — Deferred in #233; current railway lane support scope?
8. **Region defaults** — `lanes-default-speeds` and cyclestreet tables evolve; pin git rev for reproducible editor tests?
9. **Muv App roadmap** — Any public editor UX planned that would overlap with this lane editor?
