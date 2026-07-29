# twpol/osm-tiles — lane overlay tile renderer

Research note from [AB Street discussion #789](../sources/abstreet-discussion-789.md) (@tordans Nov 2021, @twpol Jan 2022). **Fetched 2026-07-25.**

| Field | Value |
|-------|-------|
| **Repo** | https://github.com/twpol/osm-tiles |
| **Live** | https://osm-tiles.james-ross.co.uk/ |
| **Demo** | https://osm-tiles.james-ross.co.uk/?map=19/51.5050/-0.0899&layer=standard&layer=all |
| **Tag test page** | https://osm-tiles.james-ross.co.uk/test.html |
| **Author** | James Ross (@twpol) |
| **Stack** | C# / ASP.NET tile service, Overpass-backed |
| **Status** | Active (README + dependabot; no recent feature commits verified) |

---

## What it does

Dynamic **transparent overlay tiles** (z16–22) that draw roads wider than a centreline — lanes, cycleways, shoulders, parking, sidewalks, verges — instead of a single highway stroke. This is exactly the “map showing lanes instead of just the road” class of tool cited in #789.

Three overlay modes: **road**, **rail**, **all** (combined).

Core logic: `TileService/Models/Geometry/Way.cs` builds a left-to-right `List<Lane>` from way tags, then `Renderer.cs` draws polygons per tile.

---

## Tags interpreted (from README + `Way.cs` + `Documentation/taginfo.json`)

### Implemented

| Tag group | Values / behaviour |
|-----------|-------------------|
| `highway=*` | Motorway classes default `oneway=yes` + `shoulder=yes`; drives base rendering |
| `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways` | Drivable lane count; wiki-aligned inference when partial ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)) |
| `oneway=yes/-1` | Direction of car lanes |
| `cycleway`, `cycleway:both/left/right`, `cycleway:*:oneway=no` | `lane`, `opposite_lane`; bidirectional cycle pairs when `:oneway=no` |
| `shoulder`, `shoulder:both/left/right` | Shoulder lanes (3 m default width) |
| `parking:lane:left/right/both` | `parallel` (3 m), `diagonal` (4.5 m), `perpendicular` (6 m) |
| `sidewalk=both/left/right` | Sidewalk strips (2 m) |
| `verge`, `verge:both/left/right` | Verge strips (2 m) |
| `layer=*` | Z-order separation |

### Fixed default widths (not from OSM)

| Lane type | Width |
|-----------|-------|
| Car | 3.0 m |
| Cycle | 1.0 m |
| Shoulder | 3.0 m |
| Sidewalk / verge | 2.0 m |

**Not read:** `width`, `width:lanes`, `placement`, `turn:lanes`, `*:lanes` access tags, bus/PSV lanes.

### Explicit TODO (README)

- Junction way-end alignment
- Bus / PSV / specialised lanes
- `placement=*`
- Turn lane markings
- `width` / tapering
- Parking bays detail, bridges/tunnels, footpaths

---

## Lane model

```csharp
enum LaneType { Edge, Sidewalk, Verge, Parking, Shoulder, Cycle, Car }
enum LaneDirection { None, Forward, Backward, Both }
```

Assembly order in `GetRoad()`: car lanes (forward → both → backward) → cycleways (outside-in inserts) → shoulders → parking → verges → sidewalks → edge markers.

**Limitations in code:**

- Comment: `// TODO: Support for driving on the right.` — layout assumes right-hand traffic.
- `lanes:both_ways` noted as “only a proposal” in source.
- `oneway=-1` cycleway mapping uses inverted side logic.
- No `cycleway=track`, `shared_lane`, `busway`, etc.

---

## Tests

`TileService.Tests/Roads.cs` — large xUnit theory matrix (~300+ cases) asserting stringified `Road(...)` output for tag combinations (lanes × oneway × highway class × shoulder × cycleway × parking × verge × sidewalk).

@twpol (Jan 2022): interested in running tags→lanes code against a **shared test suite** (osm2lanes).

**Editor implication:** High-value cross-check fixture source; string format differs from osm2lanes JSON but tag→lane-count semantics overlap.

---

## UX

- Web map with layer toggles (standard OSM + road/rail/all overlays).
- `test.html` — paste arbitrary tags, preview overlay geometry.
- On-demand tile render; OSM data cached in z14 chunks.

Not an editor — pure visualization / QA.

---

## Open questions

1. Is the live service still deployed from current `main`?
2. Would @twpol contribute C# impl to a shared test repo today?
3. RHT assumption — behaviour in LHT regions (UK demo URL is London)?
4. When bus/PSV TODO is implemented, tag set may diverge from osm2lanes — track README.

---

## Sources

- https://github.com/twpol/osm-tiles
- https://github.com/twpol/osm-tiles/blob/main/README.md
- https://github.com/twpol/osm-tiles/blob/main/TileService/Models/Geometry/Way.cs
- https://github.com/twpol/osm-tiles/blob/main/TileService.Tests/Roads.cs
- https://github.com/a-b-street/abstreet/discussions/789
