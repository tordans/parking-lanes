# Test case index

External regression fixtures to adopt into a lane-editor test suite. Priorities and tag notes live in the detailed files below.

| Source | File / location | Count | Notes |
|--------|-----------------|-------|-------|
| **muv-osm (LeLuxNet/Muv)** | [muv-osm.md](./muv-osm.md) | **~50 cases** | **Primary gold standard** — inline Rust `#[test]` in `muv-osm/src/lanes/**`; active osm2streets parser |
| osm2lanes + osm2streets | [osm2lanes-osm2streets.md](./osm2lanes-osm2streets.md) | ~90 cases | Per-way tag→lane layout; osm2lanes `tests.yml` + osm2streets area fixtures; secondary where muv diverges |
| StreetComplete CyclewayParser | [../projects/_streetcomplete-cycleway-parser.md](../projects/_streetcomplete-cycleway-parser.md) | 215+ `@Test` functions | `cycleway:*` combinations; read-only parser |
| Map Machine | [map-machine `tests/test_road.py`](https://github.com/enzet/map-machine/blob/main/tests/test_road.py) | — | Road-lanes width/placement assertions; see [map-machine.md](../projects/map-machine.md) |

**Later:** Transform these inventories into our own suite. Start with priority columns in [muv-osm.md](./muv-osm.md), then [osm2lanes-osm2streets.md](./osm2lanes-osm2streets.md) for additional tag coverage, and StreetComplete category notes when porting cycleway cases.
