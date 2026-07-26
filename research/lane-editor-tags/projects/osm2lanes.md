# osm2lanes (archived)

Research snapshot for the archived [a-b-street/osm2lanes](https://github.com/a-b-street/osm2lanes) repository. Sources: README, `data/spec-lanes.json`, `data/tests.yml`, `CONTRIBUTING.md`, and Rust source under `osm2lanes/`, `osm-tag-schemes/`, `osm2lanes-web/`.

## Origin

Spawned from [AB Street discussion #789](https://github.com/a-b-street/abstreet/discussions/789) (Oct 2021): shared **tags → ordered lane specs** library with JSON fixtures as first deliverable. See [sources/abstreet-discussion-789.md](../sources/abstreet-discussion-789.md).

## Status and relationship to osm2streets

| Item | Detail |
|------|--------|
| Status | **Archived and unmaintained** (README banner) |
| Successor | [a-b-street/osm2streets](https://github.com/a-b-street/osm2streets) — issues and ongoing work live there |
| Cutover | Experimental rewrite of lane parsing; higher-level projects never fully migrated |
| Lane logic today | README points to `osm2streets/src/lanes/classic.rs`; that path no longer exists on `main`. Active lane parsing in osm2streets now lives in the `osm2lanes` **crate inside osm2streets** (`osm2lanes/src/algorithm.rs`), which delegates to the external `muv_osm` library |
| Web demo | Still hosted at [a-b-street.github.io/osm2lanes](https://a-b-street.github.io/osm2lanes) (auto-deployed from archived repo per CONTRIBUTING) |
| Motivation | [abstreet discussion #789](https://github.com/a-b-street/abstreet/discussions/789) |

## Architecture: tags → schemes → lanes (inside-out) + separators

From README **Design** and `osm2lanes/src/transform/tags_to_lanes/mod.rs`:

1. **Input**: `Tags` map (`osm-tags` crate).
2. **Scheme parsing**: `osm-tag-schemes` extracts generic schemes (name, ref, lit, tracktype, smoothness, highway lifecycle). `osm2lanes` adds lane-specific schemes (`Oneway`, `BuswayScheme`) via `TagSchemes::from_tags`.
3. **Reconciliation**: Multiple tagging schemes may be compatible or incompatible; schemes are parsed independently then combined in a `RoadBuilder`.
4. **Inside-out lane assembly** (`modes/`): non-motorized → bus → bicycle → parking → foot/shoulder, then `road.into_ltr()` produces left-to-right lanes.
5. **Separators**: Added after lanes when `Config.include_separators` is true (default). Separator semantics live in `transform/tags_to_lanes/separator/`.

### Repository layout (archived)

| Path | Role |
|------|------|
| `data/tests.yml` | Lane parsing test cases |
| `data/spec-lanes.json` | JSON schema for lane output |
| `osm-tags` | Tag key/value types |
| `osm-tag-schemes` | Generic OSM scheme parsing |
| `osm2lanes` | Tags → lanes (+ lanes → tags round-trip) |
| `osm2lanes-web` | Yew web demo / editor prototype |
| `osm2lanes-npm` | NPM bindings |
| `osm2lanes-cli` | CLI tool |

## Tags interpreted

Derived from source modules and `data/tests.yml` (37 distinct tag keys in fixtures). Grouped by concern:

### Core road

| Tags | Handling |
|------|----------|
| `highway`, `highway=construction` (+ `construction`) | Road class; lifecycle via `osm-tag-schemes` |
| `oneway`, `oneway:bus`, `oneway:bicycle` | Direction schemes; bicycle/bus overrides |
| `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways` | Lane counts (`counts.rs`, `road.rs`) |
| `name`, `ref` | Metadata on `Road`, not lane geometry |
| `lit`, `tracktype`, `smoothness` | Road metadata schemes |

### Pedestrian / shoulder

| Tags | Handling |
|------|----------|
| `sidewalk`, `sidewalk:left/right/both`, `sidewalk:*=yes` | Mapped to foot-designated travel lanes (`foot_shoulder.rs`, tests) |
| `sidewalk=separate` | No on-way sidewalk lane (separately mapped) |
| `sidewalk=none` / `no` | Explicit absence; may warn |
| `shoulder` | Shoulder lanes |
| `foot` | Access inference for sidewalk absence |
| `highway=steps` | Foot-designated travel lane |

### Cycleways

| Tags | Handling |
|------|----------|
| `cycleway`, `cycleway:left/right/both` | Variants: `lane`, `track`, `opposite_lane`, `opposite_track`, `opposite` (shared motor), `no` |
| `cycleway:*:oneway` (`yes`, `no`, `-1`) | Direction of cycleway |
| `cycleway:*:width` | Width when parseable |
| `bicycle=designated` | Used with cycleway in complex cases |
| **Unimplemented** (warnings) | `shared_lane`, `share_busway`, `opposite_share_busway`, `shared`, `shoulder`, `separate` |

### Bus / PSV

| Tags | Handling |
|------|----------|
| `busway`, `busway:both`, `busway:left/right` | `lane`, `opposite_lane` (`busway.rs`) |
| `bus:lanes`, `bus:lanes:forward/backward` | Lane-level bus designation |
| `psv:lanes`, `lanes:bus`, `lanes:psv` | PSV lane hints (tests) |
| `bus=lanes:*`, `psv=lanes:*`, `taxi=lanes:*`, `vehicle=lanes:*`, `access=lanes:*` | Access-by-lane in real-world fixtures |

### Parking

| Tags | Handling |
|------|----------|
| `parking:lane:left/right/both` | `parallel`, `diagonal`, `perpendicular` → parking lanes (`parking.rs`) |
| `parking=lane:*` | Appears in Neukölln fixture |

### Markings, width, placement, turns

| Tags | Handling |
|------|----------|
| Separator markings | Inferred in `separator/` (not from explicit OSM marking tags in most cases) |
| `width`, `width:lanes:*` | Lane width when tagged |
| `placement`, `placement:backward` | Lane placement hints (Fremantle-style cases in osm2streets tests; limited in archived crate) |
| `turn:lanes:*`, `turn=lanes:*` | Turn restrictions per lane |
| `lane_markings` | Appears in Neukölln fixture |
| `centre_turn_lane=yes` | Center turn lane in fixtures |

### Other fixture tags

`bridge`, `maxspeed`, `motorroad`, `surface`, `toll`, `hgv`, `lit`, `int_ref`, `nat_ref` — mostly metadata or context; not all drive lane layout in archived parser.

**Locale tags in tests** (not OSM on ways): `driving_side`, `ISO 3166-2` — passed via `Locale`, not read from way tags.

## Access vs physical vs markings/widths assumptions

From README **Lane Definition** and `spec-lanes.json`:

| Aspect | Assumption |
|------|------------|
| **Physical lanes** | Continuous area along the way; direction may differ from way direction; separated by visible lines/curbs when modeled |
| **Access** | `designated` on lanes hints depiction; `access` object exists in schema but README says designated should not determine access restrictions |
| **Markings / separators** | Usually **assumed** from regional defaults, not read from OSM marking tags; most permissive line style when ambiguous; fail-deadly for safety use |
| **Widths** | From OSM when present; otherwise inferred (`source: osm` vs `osm2lanes` in schema) |
| **Condition** | Assumes new road markings |
| **Unmarked roads** | Preferred: single `travel` lane `direction: both`; alternative: directional lanes without markings only when habit persists |
| **Parallel ways** | **Not merged** — one OSM way at a time; dual carriageways/sidewalks/cycleways on separate ways are out of scope |

Lane types in output schema: `travel`, `parking`, `shoulder`, `separator`, `construction`.

Separator marking styles: `solid_line`, `broken_line`, `dashed_line`, `dotted_line`, `gore_chevron`, `diagnoal_hatched`, `criss_cross`, `no_fill`.

## Lane definition used by the project

README definition (summarized):

- A lane extends from start to end of the way.
- Lane travel direction ≠ way direction when tagged.
- Lane = continuous area without formal vehicle separation.
- Separators (paint, curbs) are modeled explicitly between lanes.
- Types come mainly from tags; separators and widths are often guesses.

`spec-lanes.json` adds `designated` values: `any`, `foot`, `bicycle`, `motor_vehicle`, `bus`, `psv`.

## UX of web demo / editor prototype

Hosted at [a-b-street.github.io/osm2lanes](https://a-b-street.github.io/osm2lanes). Built with Yew + Trunk (`osm2lanes-web`).

| Feature | Behavior |
|---------|----------|
| Tag editing | Free-form line-oriented tag text; live `tags_to_lanes` on change |
| Way fetch | Enter OSM way ID → Overpass fetch (`get_way`) with inferred locale |
| Locale | Country (ISO), driving side toggle |
| Visualization | Per-lane ASCII/type row + direction row; canvas drawing |
| Map | `MapComponent` for geographic context |
| Round-trip | `lanes_to_tags` produces normalized tags; errors shown if round-trip fails |
| Warnings | Parser warnings surfaced as user messages |
| Test YAML export | Generates `tests.yml`-shaped snippet from current state (manual way_id/description expected) |
| Editor prototype | README describes prototype to edit resulting lanes (same demo) |

CONTRIBUTING: `trunk serve` for local dev; `cargo test` in `rust/osm2lanes`; nightly `rustfmt`.

## Source index

| Resource | URL / path |
|----------|------------|
| Repository | https://github.com/a-b-street/osm2lanes |
| README | https://github.com/a-b-street/osm2lanes/blob/main/README.md |
| CONTRIBUTING | https://github.com/a-b-street/osm2lanes/blob/main/CONTRIBUTING.md |
| Lane JSON schema | https://github.com/a-b-street/osm2lanes/blob/main/data/spec-lanes.json |
| Test fixtures | https://github.com/a-b-street/osm2lanes/blob/main/data/tests.yml |
| Tags → lanes entry | https://github.com/a-b-street/osm2lanes/blob/main/osm2lanes/src/transform/tags_to_lanes/mod.rs |
| Cycleway parsing | https://github.com/a-b-street/osm2lanes/blob/main/osm2lanes/src/transform/tags_to_lanes/modes/bicycle/cycleway.rs |
| Busway parsing | https://github.com/a-b-street/osm2lanes/blob/main/osm2lanes/src/transform/tags_to_lanes/modes/bus/busway.rs |
| Parking parsing | https://github.com/a-b-street/osm2lanes/blob/main/osm2lanes/src/transform/tags_to_lanes/modes/parking.rs |
| Web app | https://github.com/a-b-street/osm2lanes/tree/main/osm2lanes-web |
| Live demo | https://a-b-street.github.io/osm2lanes |
| Motivation discussion | https://github.com/a-b-street/abstreet/discussions/789 |
| Successor lane code | https://github.com/a-b-street/osm2streets/tree/main/osm2lanes |
