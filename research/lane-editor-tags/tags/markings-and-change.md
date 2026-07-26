# Markings, lane change, and separators

## Lane markings (`lane_markings=*`)

### What it means

`lane_markings=yes|no` states whether lanes are **painted or permanently marked** on the pavement ([Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings)).

**Classification:** Physical / marking.

| Value | Use |
|-------|-----|
| `yes` | Marked lanes (use with `lanes=N`) |
| `no` | No painted lanes — may still tag `lanes=2` if two virtual directions exist |

Do **not** use `lanes=0`, `lanes=none`, `lanes=1.5` for unmarked roads ([Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings)).

### Rendering

- Straßenraumkarte: dashed centre line when `lane_markings=yes`; none when `no`.
- `overtaking=no` → solid centre line (blog).
- Experimental `lane_markings:junction=yes` (Straßenraumkarte) — **non-standard**, force markings through junction cutout.

### Related

- `road_marking=*` — **approved** schema for markings as separate geometries (junction detail, arrows, gores) — **not** for tracing every lane line along the way. Full research: [road-marking.md](road-marking.md). Canonical: [Key:road_marking](https://wiki.openstreetmap.org/wiki/Key:road_marking) (approved 2025-07-10 via [Proposal:Road_marking_revision](https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision)). [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings#See_also) may still say “experimental”.
- `divider=*` — simple centre divider type on the **highway way** ([Key:divider](https://wiki.openstreetmap.org/wiki/Key:divider)); distinct from `road_marking=lane_divider` (separate geometry) and editor UI “dividers” — see [road-marking.md § “Divider”](road-marking.md#divider--four-different-concepts).
- `crossing:markings=*` — pedestrian crossings.

---

## Lane change (`change:lanes`)

### What it means

`change:lanes=*` specifies **whether a driver may cross lane markings** to change lanes ([Key:change](https://wiki.openstreetmap.org/wiki/Key:change)).

**Classification:** Marking / restriction (legal and discouraged changes often conflated in practice).

| Value | Meaning |
|-------|---------|
| `yes` | May change left and right (edge lanes: equivalent to `not_left` / `not_right`) |
| `no` | Cannot leave lane |
| `not_right` | Cannot move right; may move left |
| `not_left` | Cannot move left; may move right |
| `only_right`, `only_left` | Deprecated synonyms — use `not_left` / `not_right` |

Syntax: `change:lanes=yes|not_right|yes|yes` with `:forward` / `:backward` on two-way roads.

### Where it applies

- Turn lane **storage** — dashed entry, solid before intersection ([Key:change](https://wiki.openstreetmap.org/wiki/Key:change)).
- Tunnels, curves, toll plazas.
- Double solid between through and turn lanes on motorways ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes) motorway example).

Physically separated turn lanes → map as **separate parallel way**, not `change:lanes`.

If lane change restriction makes a turn impossible → add **turn restriction** relation with `via` role.

### vs `overtaking=*`

[Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking): centre-line **passing** restriction (cross oncoming traffic).

[Key:change](https://wiki.openstreetmap.org/wiki/Key:change): **white line** lane changes within same direction.

| Situation | Tag |
|-----------|-----|
| Solid yellow centre (US) | `overtaking=no` |
| Solid white between lanes | `change:lanes=no` or `not_*` |
| Straßenraumkarte solid centre | `overtaking=no` |

Historically overlapping; change proposal clarifies lane marking focus.

JOSM lane_features maps `change:lanes:forward=no` to overtaking-ban display on two-lane two-way roads.

---

## Separators (cycleways and lanes)

### `cycleway:separation` / `marking` / `traffic_mode` (draft)

Full research: [separation-proposal.md](separation-proposal.md). Canonical wiki: [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation).

- **Physical (`separation`):** `bollard`, `kerb`, `planter`, `jersey_barrier`, `flex_post`, …
- **Marking (`marking`):** `solid_line`, `dashed_line`, `double_solid_line`, `pictogram`, `surface`
- **Adjacent context (`traffic_mode`):** `motor_vehicle`, `parking`, `foot`, `no` — layout/safety, not `access:lanes`

**Classification:** Physical separation + marking; `traffic_mode` is adjacent-user context.

### Lane dividers in osm2lanes / osm2streets

Parsed as **separator** objects between travel lanes with marking style (`dashed_line`, `solid_line`, double solid) — inferred from tags and regional defaults when not tagged ([osm2lanes README](https://github.com/a-b-street/osm2lanes)). These are **renderer-inferred** dividers (concept 4 in [road-marking.md](road-marking.md#divider--four-different-concepts)), not `road_marking=*` features.

### `divider=*` vs `road_marking=lane_divider`

| Mechanism | Geometry | Typical use |
|-----------|----------|-------------|
| `divider=*` on highway way | Centreline tag | Simple solid/dashed centre divider ([Key:divider](https://wiki.openstreetmap.org/wiki/Key:divider)) |
| `road_marking=lane_divider` | Separate line | Junction micromapping, markings not inferable from `change`/`overtaking` |
| Editor UI “divider” | UI slot boundary | BjornRasmussen/iD lane editors — not an OSM tag |
| `cycleway:marking=*` / `change:lanes` inference | Centreline or inferred | See [separation-proposal.md](separation-proposal.md), osm2streets separators above |

Relationship of `divider=*` to `change:lanes` **needs verification**. Prefer `change:lanes` / `overtaking` for lane-change semantics; use `road_marking` only where separate geometry is needed ([road-marking.md](road-marking.md)).

---

## Effects on rendering / editing

| Tool | Markings / change |
|------|-------------------|
| OsmLaneVisualizer | `change:lanes` as solid/dashed between lanes; `overtaking` between directions |
| JOSM lane_features | Closed line when `change:lanes=no` |
| osm2streets | Lane marking GeoJSON between lanes |
| Straßenraumkarte | `overtaking=no` solid centre; `change` planned |

## Ambiguities

1. **Discouraged vs illegal** lane changes both tagged `change:lanes=no` ([Key:change](https://wiki.openstreetmap.org/wiki/Key:change)).
2. **Imbalanced restrictions** between adjacent lanes — valid but rare.
3. **separation proposal** still draft — low global usage.
4. **`lane_markings:junction`** — experimental only.
5. **Germany overtaking signs** — vehicle-type-specific; mapping unclear ([Key:overtaking](https://wiki.openstreetmap.org/wiki/Key:overtaking)).

## Links

| Resource | URL |
|----------|-----|
| Key:lane_markings | https://wiki.openstreetmap.org/wiki/Key:lane_markings |
| Key:change | https://wiki.openstreetmap.org/wiki/Key:change |
| Key:overtaking | https://wiki.openstreetmap.org/wiki/Key:overtaking |
| Proposal:Separation | https://wiki.openstreetmap.org/wiki/Proposal:Separation |
| separation-proposal (research) | [separation-proposal.md](separation-proposal.md) |
| Key:divider | https://wiki.openstreetmap.org/wiki/Key:divider |
| Key:road_marking | https://wiki.openstreetmap.org/wiki/Key:road_marking |
| Proposal:Road_marking_revision | https://wiki.openstreetmap.org/wiki/Proposal:Road_marking_revision |
| road-marking (research) | [road-marking.md](road-marking.md) |
| Straßenraumkarte blog | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |

## Editor requirements

**Must:**

- `lane_markings` toggle; block invalid `lanes` values for unmarked roads.
- Per-lane `change:lanes` editor with standard values.
- Render inter-lane lines (solid/dashed) in preview.

**Should:**

- Turn lane taper workflow: dashed → solid segment split + `change:lanes`.
- Centre line from `overtaking` separate from inter-lane `change`.
- Prompt for turn restriction when `change` blocks required manoeuvre.

**Nice:**

- `cycleway:separation` / `marking` pickers (draft).
- `divider=*` on centre line (simple alternative to inferring from `overtaking`/`change`).
- Junction marking override (`lane_markings:junction` — non-standard) or approved `road_marking=*` layer ([road-marking.md](road-marking.md)).
