# Bicycle lanes

## What it means

Cycling infrastructure on or beside a road is tagged through **two parallel systems**:

1. **Roadside / shoulder** — `cycleway:left|right|both=lane|track|shared_lane|…` on the highway way.
2. **On-carriageway positions** — `bicycle:lanes`, `cycleway:lanes`, `vehicle:lanes` with `:lanes` pipes ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes), [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren)).

**Classification:**

| Tags | Type |
|------|------|
| `cycleway=*`, `cycleway:width`, separation/marking | Physical |
| `bicycle:lanes`, `cycleway:lanes` | Access + physical role |
| `vehicle:lanes` | Access (often needed to forbid cars on bike slot) |

**Not counted** in `lanes=*` for motor traffic ([Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes)) — unlike bus lanes.

## Roadside cycleways

| Tag | Meaning |
|-----|---------|
| `cycleway:right=lane` | Painted bike lane on right side |
| `cycleway:right=track` | Separated cycle track (may warrant separate `highway=cycleway` way) |
| `cycleway:right=shared_lane` | Shared lane marking |
| `cycleway:right:oneway=-1` | Contraflow relative to the OSM way |
| `cycleway:both=lane` | Both sides ([Straßenraumkarte](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) example) |
| `cycleway:both:oneway=yes` | Both sides **oneway**; travel still follows cars on each side — see [cycleway-oneway.md](cycleway-oneway.md) |

Subkeys: `cycleway:right:width`, `cycleway:right:buffer`, `cycleway:share_busway` (with bus lane).

Straßenraumkarte also uses `surface:colour=red|green` on cycleways — **needs verification** on dedicated wiki key; common on `highway=cycleway` in DE micromapping.

## On-carriageway / middle lanes

Canonical crossing example ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes)):

```
lanes=3
turn:lanes=left|through|through|right
vehicle:lanes=yes|yes|no|yes
bicycle:lanes=yes|no|designated|yes
cycleway:lanes=no|no|lane|no
```

- Four `:lanes` positions; `lanes=3` motor only.
- Centre **designated** bike lane between motor lanes.
- `vehicle:lanes` required — `designated` alone does not ban cars.

### Centre-running bike lane (Straßenraumkarte)

[Webellinstraße example](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) (way/413997566):

```
lanes=2
bicycle:lanes=no|designated|yes
vehicle:lanes=yes|no|yes
cycleway:lanes=none|lane|none
width:lanes=3|1.5|4
placement=right_of:1
turn:lanes=left|left;through|right
```

Bike stop line can differ from cars — requires `placement` + width for geometry.

DE wiki notes additional centre-lane examples under Radfahrstreifen Mittellage — **needs verification** for URL stability.

## Protected / separated bike lanes

### Separate OSM way

Physical separation → map `highway=cycleway` beside road. That way's `lanes=*` applies to the cycleway, not the road.

### On-line separation (draft)

Full research: [separation-proposal.md](separation-proposal.md). Canonical wiki: [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) (draft since 2020-10-27; Berlin practice since 2019).

| Key | Role |
|-----|------|
| `cycleway:separation` / `cycleway:right:separation:left` | Physical: `bollard`, `kerb`, `planter`, `flex_post`, … |
| `cycleway:marking` / `cycleway:right:marking` | `solid_line`, `dashed_line`, `pictogram`, … |
| `cycleway:traffic_mode` | Adjacent traffic context: `motor_vehicle`, `parking`, `foot`, `no` (not `access:lanes`) |
| `cycleway:buffer` | Buffer width (companion tag, out of proposal scope) |

Simple variant: `cycleway:separation=planter` on strong (motor) side only. Detailed variant: both cycleway sides; double side refs when mapped on highway line (`cycleway:right:separation:left`).

German micromapping: [Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege) (linked from proposal External discussions).

## Effects on rendering / editing

| Tool | Bike lane handling |
|------|-------------------|
| Straßenraumkarte | ~2/3 of preprocessor; roadside + on-carriageway; separation colours |
| JOSM lane_features | Blue strip for `cycleway:*=track|lane`; no `bicycle:lanes` centre lane |
| OsmLaneVisualizer | `bicycle:lanes` designated/official/no |
| osm2streets | Lane types include cycle lanes in cross-section |

## Ambiguities

1. **`cycleway:lanes=lane` vs `bicycle:lanes=designated`** — often both; `cycleway:lanes` marks infrastructure type, `bicycle:lanes` legal status.
2. **Mandatory use** — country-dependent (`no` vs `yes` on adjacent motor slots in DE vs other countries) ([Lanes](https://wiki.openstreetmap.org/wiki/Lanes) note).
3. **Counting** — bike lanes excluded from `lanes=*` but bus lanes included — editor must not merge slot models.
4. **Separated track on line vs separate way** — mapping choice affects counting and width.
5. **separation proposal** — still draft; values evolving — see [separation-proposal.md](separation-proposal.md).

## Links

| Resource | URL |
|----------|-----|
| Lanes (bike crossing example) | https://wiki.openstreetmap.org/wiki/Lanes |
| DE:Fahrspuren | https://wiki.openstreetmap.org/wiki/DE:Fahrspuren |
| Key:lanes (excludes bike) | https://wiki.openstreetmap.org/wiki/Key:lanes |
| Proposal:Separation | https://wiki.openstreetmap.org/wiki/Proposal:Separation |
| separation-proposal (research) | [separation-proposal.md](separation-proposal.md) |
| Straßenraumkarte micromap blog | https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update |
| DE:Bicycle (cycling page) | https://wiki.openstreetmap.org/wiki/DE:Bicycle |

## Editor requirements

**Must:**

- Add bike lane slots without incrementing `lanes=*` motor count.
- Set `vehicle:lanes=no` (or equivalent) on bike-only slots.
- Support roadside `cycleway:*` and on-carriageway `bicycle:lanes` + `cycleway:lanes`.
- Centre-running lane template (between motor lanes).

**Should:**

- `width:lanes` per slot including narrow bike width (~1.5 m).
- `placement` when way line is not carriageway centre.
- Contraflow: `oneway:bicycle=no`, `cycleway:*:oneway=-1`.
- Draft separation/marking fields (optional layer).

**Nice:**

- `cycleway:share_busway` combined lane UI.
- `surface:colour` for rendered bike lane colour.
- Link to separate `highway=cycleway` when track is physically separated.
