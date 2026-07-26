# Lane count (`lanes=*` and variants)

## What it means

`lanes=*` is the **total number of traffic lanes available for motorised traffic** on a highway way ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes), [DE:Key:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:lanes)).

**Included** in the count (per wiki):

- General-purpose motor vehicle lanes (wider than motorcycle-only lanes).
- **Bus / PSV lanes** reserved for public service vehicles (also tag `lanes:psv=*` etc.).
- HOV / carpool lanes (`lanes:hov=*`).
- Dynamic shoulder lanes when used as travel lanes.
- Longer slip roads / turning lanes (prefer `turn:lanes` for detail).

**Excluded** from the count:

- **Bicycle lanes** — use `cycleway=lane` or `:lanes` scheme (see NOTE below).
- Parking lanes — use `parking:*` tags.
- Emergency shoulders — use `shoulder=*`.
- Minor slip roads without acceleration/deceleration lane.

**Classification:** Physical (integer count). Related `lanes:psv=*` tags are physical **reservation counts**, not access.

## Directional variants

| Tag | Meaning |
|-----|---------|
| `lanes=*` | Total lanes both directions (or all lanes on one-way) |
| `lanes:forward=*` | Lanes in OSM way direction |
| `lanes:backward=*` | Lanes opposite to OSM way direction |
| `lanes:both_ways=*` | Centre lanes serving both directions (e.g. two-way left turn lane) |
| `lanes:both=*` | Used in JOSM lane_features style for same concept — **needs verification** vs `lanes:both_ways` |

On two-way roads with only `lanes=6` (even), consumers **assume 3+3** split ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)).

Example centre turn lane ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)):

```
lanes=3
lanes:forward=1
lanes:backward=1
lanes:both_ways=1
turn:lanes:both_ways=left
```

## Interaction with cycle lanes

### Roadside cycleways (`cycleway:right=lane`)

Typically **not counted** in `lanes=*`. Example: one motor lane + contraflow bike lane → `lanes=1` ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) photo example).

### On-carriageway cycle lanes (`bicycle:lanes`, centre bike lane)

`:lanes` tags may have **more positions than `lanes=*`**:

```
lanes=3
bicycle:lanes=yes|no|designated|yes
vehicle:lanes=yes|yes|no|yes
```

`lanes=3` = motor lanes; four pipe values = full carriageway cross-section including bike lane ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes), [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren)).

### Separately mapped `highway=cycleway`

If physically separated and mapped as its own way, that way may have its own `lanes=2` for bidirectional cycle track — **not** added to adjacent road `lanes=*`.

## Interaction with bus lanes

Bus lanes **are counted** in `lanes=*` ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes), [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes), Straßenraumkarte blog).

Example: `lanes=3` + `lanes:psv=1` = three motor lanes, one reserved for PSV.

Contrasts with bike lanes (excluded from count) — **the central counting inconsistency**.

## THE counting inconsistency problem

| Lane type | Counted in `lanes=*`? | Per-lane position via `*:lanes`? |
|-----------|----------------------|----------------------------------|
| General motor | Yes | `vehicle:lanes`, `access:lanes` |
| Bus / PSV reserved | **Yes** | `bus:lanes`, `psv:lanes` |
| HOV | Yes (with `lanes:hov`) | `hov:lanes` |
| Centre turn (both_ways) | Yes (`lanes:both_ways`) | `turn:lanes:both_ways` |
| On-carriageway bike | **No** | `bicycle:lanes`, `cycleway:lanes` |
| Roadside bike (on line) | **No** | `cycleway:*` |
| Parking | No | `parking:lane:*` |
| Shoulder | No | `shoulder=*` |

Wiki explicit NOTE ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)):

> Not settled; orthogonal with other vehicle lanes would be that all vehicle lanes including bicycle lanes count, and per-lane tagging applies for all on-street lanes.

2023 Discourse discussion linked from wiki — no consensus change as of research date.

**Editor implication:** Never assume `lanes=N` equals number of `:lanes` pipe segments. Derive slot count from max of `turn:lanes`, `bicycle:lanes`, `width:lanes`, etc.

## Ambiguous situations (wiki-listed)

May or may not be included — no strong agreement ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)):

- Unmarked lanes inferred from width/context.
- Lanes legally usable for parking without exclusive marking.
- Lanes alternating between traffic and parking by time.

Data consumers often treat `lanes=*` as a **minimum**, not exact count, when data is incomplete.

## No lane markings

Do **not** use `lanes=0`, `lanes=1.5`, `lanes=none`. Use:

```
lane_markings=no
width=4
```

Optionally `lanes=2` if two virtual directions are clear ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)).

## When to split ways

Split when lane **count** changes (lane starts or fully disappears), not only when markings change ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)). Use `width:lanes:start` / `:end` for tapering widths with `placement=transition`.

## Effects on rendering / editing

| Tool | Behaviour |
|------|-----------|
| JOSM lane_features | Symmetric split if only `lanes=`; yellow centre for odd `lanes:both`; `lanes:forward`/`backward` override |
| OsmLaneVisualizer | Max pipe count across all `:lanes` tags vs `lanes` — highlights mismatches |
| Straßenraumkarte | `lanes=2` for car space; extra slots from `bicycle:lanes` / `width:lanes` |
| osm2streets | Parses `lanes`, directional tags, classic scheme in `lanes/classic.rs` |

## Links

| Resource | URL |
|----------|-----|
| Key:lanes (EN) | https://wiki.openstreetmap.org/wiki/Key:lanes |
| DE:Key:lanes | https://wiki.openstreetmap.org/wiki/DE:Key:lanes |
| Lanes / :lanes suffix | https://wiki.openstreetmap.org/wiki/Lanes |
| DE:Fahrspuren | https://wiki.openstreetmap.org/wiki/DE:Fahrspuren |
| Bus lanes | https://wiki.openstreetmap.org/wiki/Bus_lanes |
| Key:lane_markings | https://wiki.openstreetmap.org/wiki/Key:lane_markings |
| Discourse: count cycling lanes? | https://community.openstreetmap.org/ (linked from Key:lanes, Oct 2023) |

## Editor requirements

**Must:**

- Edit `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways` with consistency checks (sum = total on two-way).
- Support slot count **independent** of `lanes=*` for on-carriageway bike lanes.
- Split way or flag when user changes lane count at a point.
- Treat bus lanes as included in motor count; bike lanes as separate slots.

**Should:**

- Warn on `lanes` vs `turn:lanes` pipe mismatch for motor lanes.
- Offer `lane_markings=no` instead of invalid lane counts.
- Document counting rules in UI (bus in, bike out).

**Nice:** `lanes:conditional`, `lanes:*:conditional` for time-varying counts.
