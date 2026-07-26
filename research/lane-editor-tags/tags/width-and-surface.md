# Width and surface

> **Deep dive (separate package):** measurement semantics, tag interactions, paint/buffer rules, Streetmix-style cross-sections → **[width-measurements](../../width-measurements/)** ([sources](../../width-measurements/sources.md)).

## Width (`width=*`, `width:lanes`)

### What it means

`width=*` is the **width of the carriageway** (kerb to kerb), including on-street cycle lanes and parking lanes, excluding sidewalks and off-kerb paths ([Key:width](https://wiki.openstreetmap.org/wiki/Key:width)).

Default unit: **metres** (no suffix required).

`width:lanes=*` gives **per-lane width** in pipe order, same rules as other `:lanes` tags ([Key:width](https://wiki.openstreetmap.org/wiki/Key:width), [Lanes](https://wiki.openstreetmap.org/wiki/Lanes)).

**Classification:** Physical / geometry.

**Not always** `sum(width:lanes) = width` — parking, shoulders, buffers, and untagged gutters sit outside the flowing-traffic pipe list (see deep dive + [StreetComplete #5593](https://github.com/streetcomplete/StreetComplete/issues/5593)).

### Variants

| Tag | Role |
|-----|------|
| `width:lanes:forward` / `:backward` | Directional per-lane widths |
| `width:lanes:start` / `:end` | Tapering lane (e.g. `width:lanes:end=\|\|0` as lane ends) |
| `width:carriageway` | Synonym emphasis for full carriageway — prefer `width=*` |
| `est_width=*` | Estimated width |
| `source:width=estimated` | Provenance for guessed widths |
| `cycleway:right:width`, `shoulder:width` | Side feature widths |
| `parking:*:width` | Parking lane width |

### Defaults in tools

| Tool | Default if missing |
|------|-------------------|
| JOSM lane_features | 3.5 m per `lanes` count |
| Straßenraumkarte | 3 m default lane; overridden by `width:lanes` |
| OsmLaneVisualizer | Optional use when enabled |
| osm2lanes | Regional/national assumptions |

### Narrow roads

If too narrow for comfortable two-lane traffic, tag `width=*` (+ `source:width=estimated`) rather than forcing `lanes=2` ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)). `narrow=yes` optional.

Sum of `width:lanes` should approximate `width=*` minus parking/shoulder — **not strictly enforced** in OSM.

### Straßenraumkarte example

```
width:lanes=3|1.5|4
placement=right_of:1
```

Car | bike | car metre widths from left; geometry anchored to way line ([blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)).

---

## Surface (`surface=*`, `surface:lanes`)

### What it means

`surface=*` describes pavement type for the way.

`surface:lanes=*` assigns surface **per lane**, e.g. cobblestone on outer lane only ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes), [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren)).

**Classification:** Physical attribute.

Empty slots inherit main `surface=*` (default value pattern).

### Surface colour

**`surface:colour=*`** (British spelling on wiki) — used in practice for red/green bike lanes ([Straßenraumkarte blog](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update): `surface:colour=red|green` on cycleways).

**Needs verification:** No dedicated Key:surface:colour wiki page found at research time; may appear on `highway=cycleway` or as lane-level extension. Related: `colour=*` for generic features.

[Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) includes `marking=surface` when different paving demarcates modes — see [separation-proposal.md](separation-proposal.md).

---

## Effects on rendering / editing

| Tool | Width / surface |
|------|-----------------|
| Straßenraumkarte | Primary consumer of `width:lanes` + placement |
| Maperitive lane rules | Width from lanes + placement |
| osm2streets | Lane width in schema; surface less prominent in render |
| JOSM lane_features | Width scales road display; surface:lanes not listed |

Effective usable width: `width=*` minus parking, or sum of `width:lanes` — `width:effective` rarely used.

---

## Ambiguities

1. **Historical fuzziness** of `width=*` on streets — kerb vs edge ([Key:width](https://wiki.openstreetmap.org/wiki/Key:width)).
2. **Includes** on-street cycle/parking in `width=*` but bike lanes often excluded from `lanes=*` count.
3. **`width:lanes` pipe count** may exceed `lanes=*` (bike slots).
4. **`surface:colour`** — documented in DE micromapping practice more than EN wiki.
5. **Estimated vs surveyed** — always tag `source:width` when guessing.
6. **Paint millimetres** — motor `width:lanes` undocumented; Berlin **buffer** includes markings; cycle usable width is between boundary lines — see [width-measurements](../../width-measurements/).
7. **`sum(width:lanes)` ≠ `width`** when parking / shoulder / gutter present ([StreetComplete #5593](https://github.com/streetcomplete/StreetComplete/issues/5593)).

## Links

| Resource | URL |
|----------|-----|
| **Width deep dive** | [../../width-measurements/](../../width-measurements/) |
| Width source index | [../../width-measurements/sources.md](../../width-measurements/sources.md) |
| Key:width (EN) | https://wiki.openstreetmap.org/wiki/Key:width |
| Lanes | https://wiki.openstreetmap.org/wiki/Lanes |
| DE:Fahrspuren | https://wiki.openstreetmap.org/wiki/DE:Fahrspuren |
| Key:surface | https://wiki.openstreetmap.org/wiki/Key:surface |
| Straßenraumkarte blog | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |
| Proposal:Separation (marking=surface) | https://wiki.openstreetmap.org/wiki/Proposal:Separation |
| StreetComplete #5593 | https://github.com/streetcomplete/StreetComplete/issues/5593 |

## Editor requirements

**Must:**

- Per-lane width fields (`width:lanes`) synced with lane slot count.
- Carriageway `width=*` with unit (metres).
- Default lane width preference (e.g. 3.0 m) configurable.

**Should:**

- `width:lanes:start` / `:end` for tapers with `placement=transition`.
- Warn when sum of lane widths ≠ carriageway width (soft check).
- `surface:lanes` per slot.
- `source:width` / `est_width` for uncertain data.

**Nice:**

- `surface:colour` per lane or cycle slot.
- Measurement tool integration (JOSM-style cross-line).
- Parking lane width via `parking:*:width` in cross-section view.
