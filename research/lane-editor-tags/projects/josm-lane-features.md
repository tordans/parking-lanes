# JOSM `lane_features` map paint style

Research note on the older JOSM MapCSS style documented at **Josm/styles/lane_features** — distinct from the newer, actively maintained [**Lane and Road Attributes**](https://josm.openstreetmap.de/wiki/Styles/Lane_and_Road_Attributes) style by Martin Vonwald (covered in [other-tools-and-visualizations.md](./other-tools-and-visualizations.md)).

## Overview

| Field | Value |
| --- | --- |
| **Name** | lane features |
| **Type** | JOSM Map Paint Style (MapCSS) |
| **Wiki (EN)** | https://wiki.openstreetmap.org/wiki/Josm/styles/lane_features |
| **Wiki (DE)** | https://wiki.openstreetmap.org/wiki/DE:Josm/styles/lane_features |
| **Purpose** | QA visualization — “realistic lanes” for checking completeness/correctness while editing |
| **Status** | Wiki describes it as “pretty new” and to “use with caution”; two variants (colored / direction arrows) |

**Note:** The [Lanes wiki](https://wiki.openstreetmap.org/wiki/Lanes#Editor_support) now points mappers to **Lane and Road Attributes** + **Lane Attributes preset**, not `lane_features`. Treat `lane_features` as historical/parallel documentation still useful for tagging semantics.

## Versions and performance

| Version | Appearance | Performance |
| --- | --- | --- |
| **Colored** | Green = right, red = left, yellow = straight (for turn arrows) | Lower resource use |
| **Direction arrows** | Arrow graphics per turn value | “Uses much more resources” — JOSM’s limited picture rendering makes this expensive |

Wiki (EN): “JOSM is slowed down considerably specially in the arrow version … depending on the performance of your actual hardware.” No program crashes reported during test phase.

Sources: [EN wiki General](https://wiki.openstreetmap.org/wiki/Josm/styles/lane_features), [DE wiki Allgemein](https://wiki.openstreetmap.org/wiki/DE:Josm/styles/lane_features).

## Interpreted tags

### `lanes`

- Total lane count.
- On non-oneway roads: lanes assumed **split symmetrically** between directions.
- **Odd** total: middle lane shown **yellow**, assumed to serve **both directions**.
- Combines with `lanes:forward` / `lanes:backward` for explicit split.

Recommended: `lanes=<#>`

### `lanes:forward`, `lanes:backward`

- Count per direction (relative to way direction).
- If only one direction given, missing value **auto-calculated** from `lanes` total when present.

Recommended:
```
lanes:forward=<f>
lanes:backward=<r>
```

### `lanes:both`

- Middle lanes serving **both directions** (e.g. shared left-turn pocket).
- Defaults: `0` if `lanes` even; `1` if `lanes` odd (when not explicit).
- Negative values → treated as `0`.

Recommended: `lanes:both=<m>` (omit when 0)

### `width`

- Carriageway width in **meters** (no unit suffix; `_m` suffix **not supported** in MapCSS).
- Default **3.5 m per lane** when `width` missing but `lanes` present.
- Without both `width` and `lanes`, way falls back to JOSM default style only.
- **Tip (wiki):** Zoom until rendered width matches reality (measure with JOSM measurement plugin) to position kerbs/hydrants accurately.

Recommended: `width=<m>`

### `turn:lanes`

- Pipe-separated per lane, counted **left to right**.
- Recognized: `straight`, `through`, `*left`, `*right`, combinations, `merge_to_left`, `merge_to_right`.
- Empty lane: `||` or `none` (ignored).
- **Critical behavior:** Style treats bare `turn:lanes` **as `turn:lanes:forward`** — lanes counted from middle of road outward on two-way roads.

**Recommendation (EN + DE wiki):** Use `turn:lanes:forward` / `turn:lanes:backward` instead of bare `turn:lanes` on two-way roads, because reversing the way breaks bare `turn:lanes` semantics.

Recommended values:
```
left, sharp_left, slight_left
right, sharp_right, slight_right
straight, through
merge_to_left, merge_to_right
|  (separator)
```

### `turn:lanes:forward` / `turn:lanes:backward`

- Same value vocabulary as `turn:lanes`.
- All `*left` / `*right` variants render **identically** (MapCSS cannot offset multiple graphics per line).
- Colored fallback version available for weaker hardware.

### `access:lanes` — **exclusive semantics**

Unlike base `access=*` (default deny, then allow per vehicle), this style treats values as **exclusive**:

| Value | Meaning in style |
| --- | --- |
| `yes` | All vehicles allowed on lane |
| `bus` | **Only** bus allowed |
| `psv` | **Only** bus and taxi (only `yes` and `psv` fully rendered today) |
| Multi-value | Use `;` separator, e.g. `motorcar;hgv` |

Example: `access:lanes=yes|yes|psv` → two general lanes + one bus/taxi lane.

**Wiki caveat (DE):** Ongoing wiki discussion about whether `hgv:lanes:forward=no|yes|…` style tagging is maintainable; style will adapt if community agrees.

Recommended:
```
access:lanes:forward=yes|yes|psv
access:lanes:backward=...
```

### `change:lanes` / `change:lanes:forward` / `change:lanes:backward`

| Value | Rendering |
| --- | --- |
| `yes` | Change both sides |
| `to_left` / `to_right` | One-sided change allowed |
| `no` | No legal change — **solid line** |

On two-way roads use `:forward` / `:backward` variants (same rationale as turn lanes).

Examples from wiki:
```
# 2-lane road, no overtaking either direction
change:lanes:forward=no
change:lanes:backward=no

# 4-lane road, overtaking allowed within direction
change:lanes:forward=to_right|to_left
change:lanes:backward=to_right|to_left
```

### `cycleway`

- Rendered: `cycleway:right/left/both=track` (and related values listed in wiki).
- Blue roadside line (~1.25 m relative to 3.5 m lane).
- **`width` on cycleway not interpreted.**

### `sidewalk`

- `sidewalk=left|right|both` — orange roadside.
- With cycleway: green; combined width ~1.5 m (sidewalk) / ~2.5 m (sidewalk+cycleway).
- **`width` on sidewalk not interpreted.**

### `lit`

- `lit=yes` — lighter rendering.
- `lit=no` — same as missing, but signals “checked, not lit.”

## Forward / backward recommendations (summary)

| Tag | Recommendation |
| --- | --- |
| `turn:lanes` | **Avoid** on two-way roads; use `:forward` / `:backward` |
| `access:lanes` | Prefer `:forward` / `:backward` on two-way roads |
| `change:lanes` | Prefer `:forward` / `:backward` on two-way roads |
| Bare `turn:lanes` on oneway | Acceptable where way reversal is unlikely |

Rationale (both EN and DE wikis): way reversal flips lane positions relative to driving direction, making undirected `turn:lanes` misleading.

## Editor implications

1. **Validation, not editing:** Style obscures the road with a lane diagram — good for understanding existing tags ([iD #387 discussion](https://github.com/openstreetmap/iD/issues/387#issuecomment-447620208) contrasts this with aerial-imagery editing).
2. **Exclusive `access:lanes`:** Editors should not copy base `access` default-deny logic into per-lane fields.
3. **Lane count ≠ `*:lanes` pipe count:** Style uses `lanes` for layout defaults; `*:lanes` may have more entries (bike lanes, etc.) — same tension as OsmLaneVisualizer and #387.
4. **Performance:** Arrow variant is a cautionary tale for live map-overlay lane UIs in JOSM-like renderers.
5. **Superseded in practice:** [Mapbox turnlanes-tagging plugin README](https://github.com/JOSM/turnlanes-tagging) now recommends **Lane and Road Attributes** style for visualization; community forum threads reference that style, not `lane_features`.

## Sources

- https://wiki.openstreetmap.org/wiki/Josm/styles/lane_features
- https://wiki.openstreetmap.org/wiki/DE:Josm/styles/lane_features
- https://wiki.openstreetmap.org/wiki/Lanes#Editor_support
- https://github.com/JOSM/turnlanes-tagging
