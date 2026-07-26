# Bus and PSV lanes

## What it means

Bus lanes on normal roads are tagged with **two coexisting schemes** ([Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes)):

### Scheme A: `lanes:bus` / `lanes:psv` (prefix count)

- `lanes:psv=1` — one lane reserved for public service vehicles (buses, often taxis).
- `lanes:bus=1` — bus-only count (excludes taxis).
- Directional: `lanes:psv:forward`, `lanes:bus:backward`, etc.
- Conditional: `lanes:bus:conditional=1 @ (Mo-Fr 07:00-19:00)`.

**Classification:** Physical reservation **count** — does not identify which lane.

### Scheme B: `bus:lanes` / `psv:lanes` (suffix per lane)

- `bus:lanes=yes|yes|designated` — which lane is the bus lane.
- Often with `access:lanes=yes|yes|no` to close lane to general traffic.
- `psv:lanes` for buses + taxis; `taxi:lanes` when taxis allowed but not designated.

**Classification:** Access per lane position.

### Off-carriageway busways

`highway=busway` for dedicated bus tracks **outside** the main carriageway — not covered by `lanes:psv` on the highway line.

## Counting vs `lanes=*`

**Bus lanes ARE included** in `lanes=*` ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes), [Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes)).

Example (Straßenraumkarte blog):

```
lanes=3
lanes:psv=1
```

→ Three motor lanes total; one is a bus lane (rendered with "BUS" marking).

Contrast with **bicycle lanes** (excluded from `lanes=*`) — see `lanes-count.md`.

### Consistency rules

| Tagging | Interpretation |
|---------|----------------|
| `lanes=3`, `lanes:psv=1` | 3 lanes, 1 reserved for PSV |
| `lanes=3`, `bus:lanes=\|designated` | 3 lanes, rightmost bus — `lanes:bus=1` implied |
| `lanes:psv=1` without matching access | Position unknown — consumers guess edge lane |

Wiki: `lanes:hgv=1` means **one lane reserved for HGV**, NOT "HGV restricted to one lane" — different from `hgv:lanes` ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)).

## Examples (from wiki)

**Oneway exclusive bus lane:**

| lanes:psv scheme | bus:lanes scheme |
|------------------|------------------|
| `lanes=3` `lanes:bus=1` | `lanes=3` `access:lanes=yes\|yes\|no` `bus:lanes=yes\|yes\|designated` |

**Contraflow bus lane** (two-way function on one-way street):

```
lanes=2
lanes:forward=1
lanes:backward=1
lanes:psv:backward=1
oneway=yes
oneway:bus=no
```

**Shared bus + bike:** `cycleway:share_busway` + `bicycle:lanes` / `oneway:bicycle=no` as needed.

## Which scheme to use?

[Bus lanes](https://wiki.openstreetmap.org/wiki/Bus_lanes):

- **Prefix** simpler; newer wiki pages favour it.
- **Suffix** gives lane **position** and mixed access (taxi yes, not designated).
- Schemes are logically related; pick one for maintainability; both can coexist.

## Effects on rendering / editing

| Tool | Bus lane support |
|------|------------------|
| Straßenraumkarte | `lanes:psv` → BUS text on lane |
| OsmLaneVisualizer | `bus:lanes`, `psv:lanes` designated/official |
| JOSM lane_features | `access:lanes` psv value |
| osm2streets | Lane type from classic parsing — **needs verification** for all conditional variants |

## Ambiguities

1. **`lanes:psv` vs `lanes:bus`** — taxis included in psv, not bus.
2. **Position** — prefix scheme alone insufficient for Straßenraumkarte-style precise placement; need `bus:lanes` or assumption (usually kerb-side).
3. **Conditional lanes** — both schemes support `:conditional`; editor UX complex.
4. **`bus_bay=*`** — pickup bay, not continuous bus lane; incompatible with `lanes:psv` per wiki.
5. **Proposal to deprecate `busway=*` for on-street lanes** — check current status before relying on.

## Links

| Resource | URL |
|----------|-----|
| Bus lanes (EN) | https://wiki.openstreetmap.org/wiki/Bus_lanes |
| Key:lanes | https://wiki.openstreetmap.org/wiki/Key:lanes |
| Lanes | https://wiki.openstreetmap.org/wiki/Lanes |
| highway=busway | https://wiki.openstreetmap.org/wiki/Tag:highway=busway |
| Bus lanes viewer | https://wiki.openstreetmap.org/wiki/Bus_lanes#Services |

## Editor requirements

**Must:**

- Include bus lanes in `lanes=*` total.
- Support `bus:lanes` / `psv:lanes` per-slot designation.
- Support `lanes:bus` / `lanes:psv` reservation count with consistency check.
- `access:lanes` denial on bus-only slots when using suffix scheme.

**Should:**

- Contraflow template (`oneway:bus=no`, directional `lanes:psv:backward`).
- `cycleway:share_busway` when bikes allowed in bus lane.
- `turn:bus:lanes` at junctions.
- Conditional time ranges.

**Nice:**

- Scheme migration helper (prefix ↔ suffix).
- Separate `highway=busway` way type for off-carriageway tracks.
