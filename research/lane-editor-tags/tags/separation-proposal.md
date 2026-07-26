# Separation proposal (`separation`, `marking`, `traffic_mode`)

Research note for [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) — draft tagging for physical and symbolic separation between cycleways, road lanes, and other traffic ways. Canonical wiki URL; older alias `Proposed_features/cycleway:separation` serves the same page (no HTTP redirect, shared canonical).

**Last reviewed:** 2026-07-25  
**Primary source:** [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) (draft started 2020-10-27, last edited 2023-06-09)

---

## Status and history

| Item | Detail |
|------|--------|
| **Status** | Draft (under way) |
| **Proposed by** | [Supaplex030](https://wiki.openstreetmap.org/wiki/User:Supaplex030) |
| **Draft started** | 2020-10-27 |
| **Applies to** | `way` |
| **Berlin practice** | Tested on cycleways since **2019** (before formal proposal) |
| **ITDP collaboration** | Reworked summer **2022** with Institute for Transportation and Development Policy for global mapping tests |
| **Usage (2022-07-20)** | ~6,514 `separation` keys (462 simple, 6,042 detailed) |

Still draft — values and semicolon-combination rules under discussion. Berlin micromapping and Straßenraumkarte treat it as de-facto practice despite draft status.

---

## Three schemas

The proposal defines three parallel key namespaces, all usable with the same left/right/both side suffix pattern:

| Schema | Role | Classification |
|--------|------|----------------|
| **`separation`** | Physical dividers/protection between a way/lane and adjacent traffic areas | **Physical** |
| **`marking`** | Non-physical road markings that demarcate traffic areas | **Marking** (physical demarcation, not access) |
| **`traffic_mode`** | Type of road users **adjacent** on each side of the way | **Layout / safety context** — not `access:lanes` |

A cycleway can carry `separation` and `marking` together (e.g. kerb plus solid line). `traffic_mode` clarifies *who* is on the other side of each separation — relevant when layout deviates from defaults (parking buffer, wrong-side cycle lane, stand-alone path with no adjacent traffic).

**Level of protection** is intentionally left to data consumers; values imply typical motor-vehicle passability (bollards vs dashed line vs parking/dooring risk).

---

## Access vs physical classification

| Family | Question answered | Example |
|--------|-------------------|---------|
| `access:lanes`, `bicycle:lanes`, `vehicle:lanes` | Who **may use** each lane? | `bicycle:lanes=no\|designated\|yes` |
| `separation`, `marking` | What **physically or symbolically** separates lanes/ways? | `cycleway:right:separation:left=bollard` |
| `traffic_mode` | What traffic **flows adjacent** on each side? (defaults assumed if omitted) | `cycleway:traffic_mode:left=parking` |

`traffic_mode` values follow the `access=*` vocabulary (`foot`, `motor_vehicle`, `psv`, …) but describe **neighbouring** traffic for safety/layout analysis — not legal access on the tagged way itself. Example: `traffic_mode:both=no` on a stand-alone bridge path means no adjacent users, so separation is unnecessary.

Do **not** conflate `traffic_mode=parking` with deprecated `separation=parking` — parking as adjacent context uses `traffic_mode` only.

---

## Simple vs detailed tagging

### Simple variant

Tag separation on the **“strong” side only** — towards the middle of the road and strongest traffic users (motor vehicles in right-hand traffic: usually the **left** side of the cycleway).

| Context | Key |
|---------|-----|
| Cycleway on highway line (`cycleway=*`) | `cycleway:separation=*` or `cycleway:right:separation=*` |
| Separate cycleway (`highway=cycleway`) | `separation=*` |

Example: `cycleway:separation=planter`

Same simple pattern applies to `marking` and `traffic_mode`.

### Detailed variant

Specify **both sides** of the cycleway with `:left` / `:right` (or `:both` when identical):

| Context | Keys |
|---------|------|
| Cycleway on highway line | `cycleway:separation:left`, `cycleway:separation:right` |
| Separate cycleway | `separation:left`, `separation:right` |

### Double side references (cycleway on highway)

When the cycleway is mapped on the road line, keys can contain **two** side indications:

```
cycleway:right:separation:left=vertical_panel
cycleway:right:separation:right=kerb;tree_row
```

1. First side (`cycleway:right`) — which side of the **road** the cycleway is on (relative to OSM way direction).
2. Second side (`separation:left`) — which side of the **cycleway** the separation applies to.

Up to **four** statements when cycleways exist on both road sides:

- `cycleway:right:separation:left` / `:right`
- `cycleway:left:separation:left` / `:right`

`:both` shorthand when both cycleway sides share the same value: `cycleway:right:separation:both=kerb`, `cycleway:both:separation:left=no`.

`marking` and `traffic_mode` follow the same patterns.

---

## Value lists

### `separation` (physical)

| Value | Meaning |
|-------|---------|
| `no` | No physical separation (markings may still exist) |
| `bollard` | Fixed bollards blocking vehicles |
| `flex_post` | Flexible plastic delineators |
| `vertical_panel` | Traffic panels (sometimes temporary) |
| `studs` | Botts' dots / raised pavement markers |
| `bump` | Small bumps, guide curbs, armadillos (see deprecated aliases below) |
| `planter` | Flower boxes / planters |
| `kerb` | Kerb / curb |
| `fence` | Railing fence |
| `jersey_barrier` | Modular concrete/plastic barrier |
| `guard_rail` | Guard rail / crash barrier |
| `structure` | Fixed structure (bridge arch, pillar) |
| `ditch` | Small channel / depression |
| `greenery` | Grass strip |
| `hedge` | Hedge or dense scrub (harder to cross than greenery) |
| `tree_row` | Line of trees |
| `cone` | Movable/temporary traffic cones |
| `yes` | Unspecified physical separation — prefer a precise value |

**Deprecated `separation` values** (use alternatives):

| Deprecated | Use instead |
|------------|-------------|
| ~~`parking`~~ | `traffic_mode=parking` |
| ~~`not_required`~~ | `traffic_mode` scheme (e.g. `no`) |
| ~~`separation_kerb`~~, ~~`lane_separator`~~ | `bump` |
| ~~`bus_lane`~~, ~~`psv_lane`~~ | `traffic_mode=psv` |

**Semicolon combinations** (e.g. `kerb;greenery`) — still under discussion; if used, order inside → outside (closer to tagged way first).

### `marking` (symbolic)

| Value | Meaning |
|-------|---------|
| `solid_line` | Solid line — often exclusive/mandatory lane (country-dependent) |
| `dashed_line` | Dashed — often crossable |
| `double_solid_line` | Double solid — exclusive, heightened attention |
| `barred_area` | Buffer/restricted area marking; consider `cycleway:buffer=*` |
| `pictogram` | Mode-specific symbolic marking |
| `surface` | Different paving/surface between adjacent areas (common on combined cycle/footways) |

No generally accepted OSM scheme for all road markings exists; this key types the marking explicitly rather than inferring from `cycleway:lane=*`, `change=*`, or `overtaking=*`.

### `traffic_mode` (adjacent users)

| Value | Meaning |
|-------|---------|
| `no` | No adjacent traffic on this side — separation not needed |
| `motor_vehicle` | Flowing motor traffic (default towards road centre for cycleways in RHT: left side) |
| `parking` | Parking lane or area |
| `psv` | Exclusive bus/taxi lane |
| `bicycle` | Adjacent cycle path |
| `foot` | Pedestrian area / footpath (default towards road edge for cycleways) |

Defaults are assumed when omitted; tag only when layout differs (e.g. cycle lane on wrong side, parking buffer, isolated path).

---

## Left and right direction rules

| Situation | `:left` / `:right` refer to |
|-----------|----------------------------|
| Oneway way | Direction of **travel** |
| Non-oneway, separately mapped way | Direction of the **OSM line** |
| Bidirectional cycleway on highway (`cycleway:*:oneway=no`) | Direction traffic **would** use if one-way — usually same as adjacent motor lane travel direction |
| Cycleway on highway line | Road side from OSM way direction (`cycleway:right`, `cycleway:left`, `cycleway:both`) **plus** cycleway-side `:left`/`:right` as above |

`:both` can replace `:left` and `:right` when values are identical on both sides of the cycleway.

---

## Use on roads and lanes (not only cycleways)

The scheme applies to **any traffic way** — whole roads, individual motor lanes, bus lanes, middle bike lanes:

| Example | Tags |
|---------|------|
| Lane dividers on two-lane road | `separation:lanes:forward=vertical_panel`, `separation:lanes:backward=vertical_panel` |
| Motorway edge protection | `separation:left=studs;guard_rail`, `separation:lanes=studs\|studs` |
| Centre-running bike lane (Holzmarktstraße) | `cycleway:separation:left:lanes=\|\|studs\|\|no`, `cycleway:separation:right:lanes=\|\|no\|\|kerb`, `cycleway:marking:left:lanes=\|\|solid_line\|\|solid_line` |

**Editor implication:** separation UI must work for:

- Roadside `cycleway:*` (double side refs),
- On-carriageway `cycleway:lanes` positions (pipe-separated `:lanes` suffix),
- Motor-lane edges on the highway way itself.

Middle bike lanes and bus-lane edges need per-slot separation/markings aligned with `width:lanes` and `bicycle:lanes` pipe order.

---

## Buffer (`cycleway:buffer`)

Buffer **width** is a companion tag, **out of proposal scope**:

> Consider using tags like `cycleway:buffer=*` in combination with separation or marking tagging. However, this is not part of this documentation.

Straßenraumkarte reads `cycleway:*:buffer` for geometry offsets. `marking=barred_area` often pairs with a buffer.

---

## Consumers in our research

| Project | Support | Notes |
|---------|---------|-------|
| **Straßenraumkarte** | **Heavy** | `cycleway:*:separation` cascade → per-lane `separation:left/right` rendering; `cycleway:*:marking:*`; `cycleway:*:traffic_mode:*` for parking offset. See [strassenraumkarte.md](../projects/strassenraumkarte.md) |
| **osm2streets / muv-osm** | No dedicated parser | Generic lane separators inferred; does not read proposal keys |
| **OsmLaneVisualizer** | Not listed in 105+ key table | — |
| **JOSM lane_features** | No | Blue cycle strip only |
| **StreetComplete CyclewayParser** | No | Roadside cycleway tags only |
| **Berlin Verkehrswende Radwege wiki** | Practice docs | Exemplar micromapping patterns |

Primary consumer justification for editor **should** priority: Berlin/Straßenraumkarte pipeline.

---

## Editor requirements

| Priority | Requirement |
|----------|-------------|
| **Must** | Read/write simple variant (`cycleway:separation`, `cycleway:marking`) on roadside cycle lanes |
| **Must** | Preserve unknown sided keys on round-trip (do not strip `cycleway:right:separation:left`) |
| **Should** | UI for both sides of cycleway (`:left`/`:right`) with correct double-side refs when `cycleway:left/right` set |
| **Should** | `traffic_mode` picker for non-default layouts (parking buffer, wrong-side lane, isolated path) |
| **Should** | Value pickers for full `separation` and `marking` enumerations |
| **Should** | On-carriageway per-lane separation (`cycleway:separation:*:lanes` pipes) for centre bike lanes |
| **Nice** | Semicolon multi-value `separation` (kerb;greenery) with inside→outside ordering hint |
| **Nice** | `cycleway:buffer` width field linked to separation UI |
| **Nice** | Motor-lane `separation:lanes:*` for road/divider editing |
| **Nice** | Defaults helper: auto-suggest `traffic_mode` left=motor_vehicle, right=foot in RHT unless overridden |

**UI complexity:** up to four sided keys per road side (`cycleway:right:separation:left`, `:right`, `:marking:*`, `:traffic_mode:*`) × two road sides = dense form. Prefer cross-section diagram over flat key list; simple mode (strong side only) as default.

---

## Ambiguities

1. **Draft status** — not approved; keys may change; high usage in DE micromapping anyway.
2. **Semicolon combinations** — discussed but not finalised.
3. **`yes` on separation** — discouraged; prefer specific value.
4. **Deprecated values** — still appear in older Berlin data (`parking`, `not_required`).
5. **`traffic_mode` vs `access:lanes`** — similar vocabulary, different semantics (adjacent vs on-lane access).
6. **Separate `highway=cycleway` way** — use bare `separation:*` without `cycleway:` prefix.
7. **Buffer** — documented separately; not part of proposal page.

---

## Links

| Resource | URL |
|----------|-----|
| **Proposal:Separation** (canonical) | https://wiki.openstreetmap.org/wiki/Proposal:Separation |
| Old alias (same page) | https://wiki.openstreetmap.org/wiki/Proposed_features/cycleway:separation |
| Berlin micromapping (DE, External discussions) | https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege |
| Overpass query (linked from proposal) | http://overpass-turbo.eu/s/16m3 |
| Straßenraumkarte micromap blog | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |
| Lanes — centre bike lane example | https://wiki.openstreetmap.org/wiki/Lanes |
| Proposal discussion page | https://wiki.openstreetmap.org/wiki/Proposal_talk:Separation |

---

## Source index

| URL | Summary |
|-----|---------|
| https://wiki.openstreetmap.org/wiki/Proposal:Separation | Full proposal text: three schemas, values, examples, usage stats |
| https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege | German Berlin community micromapping guide linked from proposal External discussions |
| http://overpass-turbo.eu/s/16m3 | Overpass Turbo query for cycleways with separation tags |
| https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update | Straßenraumkarte blog: separation rendering, protected bike lanes |
| https://github.com/osmberlin/strassenraumkarte-neukoelln/blob/main/mapstyle/post_processing.py | Implementation: separation/marking/traffic_mode cascade |
| https://wiki.openstreetmap.org/wiki/Lanes | On-carriageway bike lane + `cycleway:separation:*:lanes` example (Holzmarktstraße) |
