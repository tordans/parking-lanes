# Turn lanes (`turn:lanes`)

## What it means

`turn:lanes=*` specifies the **indicated turn or merge direction** for each lane, from road markings, signs, or channelization ([Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn), [DE:Key:turn:lanes](https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes)).

- Applies from first indication to junction or merge completion.
- Describes **indication**, not legal turn permission — add `restriction=*` relations where needed.
- **Centreline** `turn:lanes` is the primary tag; **physical arrow paint** in junction areas may additionally use `road_marking=arrow` + `arrow=*` when separate geometry is needed ([road-marking.md](road-marking.md)).
- Absence of a turn value does **not** mean the turn is forbidden.

**Classification:** Manoeuvre / marking (not access). Pairs with `destination:lanes`, `change:lanes`.

## Syntax

| Pattern | Use |
|---------|-----|
| `turn:lanes=left\|through\|right` | One-way or all lanes same direction |
| `turn:lanes:forward=*` | Lanes in OSM way direction (two-way) |
| `turn:lanes:backward=*` | Lanes opposite OSM way direction |
| `turn:lanes:both_ways=*` | Centre two-way turn lane |

Pipe order: **left to right** in the direction of travel being tagged.

Multiple manoeuvres per lane: semicolon-separated, e.g. `through;right`, `left;through`.

Empty slot or `none` = no turn arrow on that lane (`||right` ≡ `none|none|right`).

## Values

| Value | Meaning |
|-------|---------|
| `none` / empty | No turn indication |
| `left`, `slight_left`, `sharp_left` | Left variants |
| `through` | Straight (also `straight` in the wild — JOSM style accepts both) |
| `right`, `slight_right`, `sharp_right` | Right variants |
| `reverse` | U-turn |
| `merge_to_left`, `merge_to_right` | Lane ends; traffic must merge |

Combinations: `left;through`, `through;right`, `left;through;right`, etc. Order of combined values not fully standardized ([Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn)).

Vehicle-specific: `turn:bus:lanes`, `turn:psv:lanes`, `turn:bicycle:lanes`.

## Junction issues

### Way extent vs physical lanes

From [Lanes](https://wiki.openstreetmap.org/wiki/Lanes):

- Way should extend to intersection node even where markings end inside junction.
- Turn lane **transition** (dashed taper) may be **outside** the `lanes=3` segment — split at full lane formation, not at first dash.
- Missing `change:lanes` on taper is common; solid line at storage area is where lane change ends.

### Complex connectivity

When arrows don't match actual lane connections, use [Relation:connectivity](https://wiki.openstreetmap.org/wiki/Relation:connectivity) — **needs verification** for full spec; referenced from Key:turn.

Abandoned `turnlanes` relation proposal — do not use for new mapping.

### Motorway examples

Wiki motorway chain ([Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn)):

```
turn:lanes=none|none|none|merge_to_left
change:lanes=yes|yes|not_right|yes
turn:lanes=none|through|through|slight_right
destination:lanes=A|A|B
```

### Junction rendering (Straßenraumkarte)

[Straßenraumkarte blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update): junction lane markings often wrong without `area:highway` cutouts; experimental `lane_markings:junction=yes` — **non-standard**. Physical arrow geometry in junctions may also be mapped with approved `road_marking=arrow` + `arrow=*` (must stay consistent with `turn:lanes`) — see [road-marking.md](road-marking.md).

## What is NOT `turn:lanes`

- Parking aisle one-way arrows → `oneway=yes`
- Wrong-way warning arrows
- Drive-through directional paint
- Bend warning signs → `hazard=*`, `traffic_sign=*`

## Effects on rendering / editing

| Consumer | Support |
|----------|---------|
| OsmAnd, Organic Maps, Magic Earth | `turn:lanes` for navigation |
| OSM2World | Painted markings in 3D |
| OsmLaneVisualizer | Unicode arrows per lane |
| JOSM Lane and Road Attributes | Arrow overlay; prefers `turn:lanes:forward/backward` on two-way |
| JOSM lane_features style | Treats bare `turn:lanes` as forward-only on two-way — **pitfall** |
| osm2streets | Turn arrows in lane marking GeoJSON |
| Straßenraumkarte | Renders arrows from `turn:lanes` |

## Ambiguities

1. **`turn:lanes` vs `turn:lanes:forward`** on two-way — JOSM lane_features warns bare `turn:lanes` is error-prone if way reversed.
2. **Pipe count** must match lane count **for that direction** (including `lanes:both_ways` slot).
3. **`straight` vs `through`** — both exist; prefer `through` per wiki.
4. **Combined value order** (`left;through` vs `through;left`) — discussed, not fully settled.
5. **Centre turn lane** — use `turn:lanes:both_ways`, not mixed into forward/backward without both_ways slot.

## Links

| Resource | URL |
|----------|-----|
| Key:turn (EN) | https://wiki.openstreetmap.org/wiki/Key:turn |
| DE:Key:turn:lanes | https://wiki.openstreetmap.org/wiki/DE:Key:turn:lanes |
| Lanes | https://wiki.openstreetmap.org/wiki/Lanes |
| Key:change | https://wiki.openstreetmap.org/wiki/Key:change |
| JOSM TurnLanes plugin | https://wiki.openstreetmap.org/wiki/JOSM/Plugins/TurnLanes-tagging |
| Lane assist (best practices) | https://wiki.openstreetmap.org/wiki/Lane_assist |

## Editor requirements

**Must:**

- Per-lane turn arrow picker with standard values + combinations.
- `turn:lanes:forward` / `:backward` on two-way roads (default, not bare `turn:lanes`).
- Validate pipe count vs lane slots for direction.
- Support `turn:lanes:both_ways` when `lanes:both_ways` present.

**Should:**

- Link to `change:lanes` when editing turn lane tapers.
- Show `destination:lanes` alongside turn editing at motorway exits.
- Warn when turn indication implies illegal manoeuvre without restriction relation.

**Nice:**

- Vehicle-specific turn lanes.
- Connectivity relation editor for complex junctions.
- Preview arrows on map (osm2streets-style).
