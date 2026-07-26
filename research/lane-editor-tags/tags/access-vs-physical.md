# Access vs physical lane model

## Summary

OSM lane tagging separates two concerns that a lane editor must keep distinct:

1. **Access / mode** — who may use each lane (`access:lanes`, `bicycle:lanes`, `bus:lanes`, `psv:lanes`, `vehicle:lanes`, `hgv:lanes`, `foot:lanes`, …).
2. **Physical infrastructure** — how many lanes exist, how wide they are, what surface/markings/separators they have (`lanes`, `width:lanes`, `cycleway=*`, `lane_markings`, separation proposals).

Both families use the same **`:lanes` suffix schema**: pipe-separated values in **left-to-right order in the direction of travel** being described (with `:forward` / `:backward` on two-way roads).

## The `:lanes` schema (shared pattern)

From [Lanes](https://wiki.openstreetmap.org/wiki/Lanes):

- Any `key=value` can become `key:lanes=value1|value2|value3` (and `key:lanes:forward` / `:backward`).
- Empty lane slots inherit the main key without `:lanes` (default value).
- **Lane index 1** = leftmost lane in the described direction of travel.
- The number of pipe-separated values in `*:lanes` tags **need not equal** `lanes=*` when non-motor lanes exist on the carriageway (see bicycle example below).

This pattern applies equally to:

| Family | Example keys |
|--------|----------------|
| Access | `access:lanes`, `bicycle:lanes`, `bus:lanes`, `psv:lanes`, `vehicle:lanes`, `hgv:lanes`, `foot:lanes`, `motorcycle:lanes` |
| Attributes | `maxspeed:lanes`, `minspeed:lanes`, `surface:lanes`, `destination:lanes`, `hov:lanes` |
| Manoeuvre | `turn:lanes`, `change:lanes` |
| Geometry | `width:lanes`, `placement` (way-level, not per-lane pipes) |

## Access / mode tags

**Meaning:** Legal or designated use per lane. Values follow [Key:access](https://wiki.openstreetmap.org/wiki/Key:access) (`yes`, `no`, `designated`, `destination`, …).

**Classification:** Access.

**Critical rule:** `designated` for one mode does **not** forbid other modes unless explicitly tagged. Example from [Lanes](https://wiki.openstreetmap.org/wiki/Lanes):

```
lanes=3
turn:lanes=left|through|through|right
vehicle:lanes=yes|yes|no|yes
bicycle:lanes=yes|no|designated|yes
cycleway:lanes=no|no|lane|no
```

Here `lanes=3` counts motor lanes only; four `:lanes` positions include the centre bike lane. `vehicle:lanes` explicitly closes the bike lane to motor traffic.

Common access keys for lane editors:

| Tag | Typical use |
|-----|-------------|
| `access:lanes` | General permission per lane |
| `vehicle:lanes` | Motor vehicles (excluding cycles unless allowed) |
| `bicycle:lanes` | Cycle access/designation per on-carriageway position |
| `bus:lanes` / `psv:lanes` | Bus / public-service vehicle lanes |
| `hgv:lanes` | Heavy goods restrictions (restriction, not count — see `lanes:hgv` confusion in wiki) |
| `foot:lanes` | Pedestrian-designated lanes (rare) |
| `motorcycle:lanes` | Motorcycle-specific lanes narrower than car lanes |

Vehicle-specific turn variants exist: `turn:bus:lanes`, `turn:bicycle:lanes`, `turn:psv:lanes` ([Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn)).

## Physical infrastructure tags

**Meaning:** Material road cross-section — lane count, width, surface, cycle track vs lane, markings, separators.

**Classification:** Physical (plus geometry for `placement`, `width:lanes`).

| Tag | Role |
|-----|------|
| `lanes`, `lanes:forward`, `lanes:backward`, `lanes:both_ways` | Integer count of **motorised** traffic lanes ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)) |
| `lanes:psv`, `lanes:bus`, … | Count of lanes **reserved** for a mode (not which lane) |
| `width`, `width:lanes`, `width:lanes:start`, `width:lanes:end` | Metre widths |
| `surface`, `surface:lanes` | Pavement type per lane |
| `cycleway:left/right/both`, `cycleway:lanes` | Roadside cycle infrastructure on the highway line |
| `lane_markings` | Whether lanes are painted (`yes`/`no`) |
| `cycleway:separation`, `cycleway:marking`, `cycleway:traffic_mode` | Draft separation/marking ([Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation)); `traffic_mode` = adjacent layout context, not access — see [separation-proposal.md](separation-proposal.md) |
| `shoulder`, `shoulder:*:width` | Emergency/soft shoulder (excluded from `lanes` count) |

Roadside `cycleway=lane|track` is **physical placement** on the shoulder; on-carriageway cycling is usually **`bicycle:lanes` + `cycleway:lanes`** together.

## Effects on rendering / editing

| Concern | Access tags | Physical tags |
|---------|-------------|---------------|
| Lane count in UI | May require **more slots** than `lanes=*` | `lanes=*` sets motor lane count |
| Lane icons (bus, bike) | `bus:lanes=designated`, `bicycle:lanes=designated` | `cycleway:lanes=lane`, coloured surface |
| Turn arrows | `turn:lanes` (manoeuvre, not access) | — |
| Cross-section position | — | `placement`, `width:lanes` |
| Validators | Pipe count must match across related `*:lanes` for same direction | `lanes:forward` + `lanes:backward` + `lanes:both_ways` should sum consistently |

**Straßenraumkarte** ([blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)) combines physical (`width:lanes`, `placement`) with access (`bicycle:lanes`, `vehicle:lanes`) to place bike lanes between car lanes.

**osm2streets** builds lanes inside-out from tags; access affects lane type rendering in StreetExplorer lane editor.

## Ambiguities and pitfalls

1. **`lanes=*` vs `:lanes` pipe count** — Motor count vs all flowing lanes on carriageway ([DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) example: `lanes=3`, four `*:lanes` values).
2. **`lanes:bus=1` vs `bus:lanes=|designated`** — Count/reservation vs per-lane position ([Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes)).
3. **`lanes:hgv=1` vs `hgv:lanes=no|no|yes`** — Wiki warns these mean different things ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)).
4. **`designated` without `no` on other modes** — Must add explicit `vehicle:lanes` / `access:lanes` denials.
5. **Bike lane counting in `lanes=*`** — Wiki excludes cycle lanes but notes unsettled alternative (include all vehicle lanes). Mark **needs verification** for your consumer.
6. **Default inheritance** — Empty `maxspeed:lanes=||80` inherits `maxspeed=*`; same pattern for access defaults is less clear — treat unset lane slots as main-key default only when documented.

## Links

| Resource | URL |
|----------|-----|
| Lanes (EN) | https://wiki.openstreetmap.org/wiki/Lanes |
| DE:Fahrspuren | https://wiki.openstreetmap.org/wiki/DE:Fahrspuren |
| Key:access | https://wiki.openstreetmap.org/wiki/Key:access |
| Key:lanes | https://wiki.openstreetmap.org/wiki/Key:lanes |
| lanes General Extension (approved) | https://wiki.openstreetmap.org/wiki/Proposed_features/lanes_General_Extension |
| OsmLaneVisualizer | https://github.com/mueschel/OsmLaneVisualizer |
| osm2streets lane editor | https://a-b-street.github.io/osm2streets/lane_editor.html |

## Editor requirements

A lane editor **must**:

- Model **lane slots** as first-class objects, not only `lanes=N` integers.
- Support adding slots beyond motor count for on-carriageway bike/bus lanes.
- Keep `*:lanes` pipe counts consistent per direction when editing related tags together.
- Distinguish UI for **access** (who) vs **physical** (width, surface, separation).
- Warn when `lanes=*` disagrees with implied motor slots from `vehicle:lanes` / `turn:lanes`.

A lane editor **should**:

- Offer templates for common combos (bus lane right, centre turn lane, protected bike lane).
- Show inherited defaults for empty pipe slots (`maxspeed:lanes`, etc.).
- Support `:forward` / `:backward` on all `:lanes` keys.

**Nice to have:** vehicle-specific turn lanes, conditional `*:conditional` access per lane.
