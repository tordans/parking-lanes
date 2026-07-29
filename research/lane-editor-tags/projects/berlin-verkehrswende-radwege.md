# Berlin Verkehrswende Radwege (wiki)

Tagging-examples source for German-community cycleway micromapping — not a tool. Schema is **still evolving** (Berlin practice / meetup draft; not a finished global proposal).

## Overview

| Field | Value |
| --- | --- |
| **URL** | https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege (redirects to [Verkehrswende-Meetup/Radwege](https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege)) |
| **Tagging examples** | [#Tagging-Beispiele](https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege#Tagging-Beispiele) |
| **Mentioned in** | [#789 @tordans, @dabreegster goals](https://github.com/a-b-street/abstreet/discussions/789) |
| **Coverage** | Tag inventory below; exemplar way IDs → fixtures still optional |

## Two mapping models

The page motivates **separate** `highway=cycleway` geometries for physically separated tracks, while painted on-carriageway lanes stay on the road centreline. A lane editor must handle both.

| Model | Where tags live | Road centreline pointer |
| --- | --- | --- |
| **On-road** (painted lane / advisory) | Prefixed `cycleway:SIDE:*` on the highway | `cycleway:left\|right\|both=lane` (+ optional `exclusive`/`advisory`) |
| **Separate way** (kerb / protected) | Plain tags on `highway=cycleway` | `cycleway:SIDE=separate` (+ often `bicycle=use_sidepath`) |

`SIDE` = `left` \| `right` \| `both`. On a separate cycleway, omit the `cycleway:` prefix (`width`, `separation:left`, `buffer:right`, …).

## Tags relevant for lane editing

### A. Presence / geometry role (must parse)

| Tag (on road / on cycleway) | Role for editor |
| --- | --- |
| `cycleway:SIDE=lane` | On-carriageway bike strip — usually a cross-section slot |
| `cycleway:SIDE=track` | Physically separated; prefer separate way, or still on-line |
| `cycleway:SIDE=separate` | Details live on parallel `highway=cycleway` |
| `cycleway:SIDE=no` | Explicit absence (important for completeness QA) |
| `cycleway:SIDE:lane=exclusive\|advisory` | Radfahrstreifen (solid) vs Schutzstreifen (dashed) |
| `highway=cycleway` + `is_sidepath=yes` | Separate sidepath way |
| `is_sidepath:of=*` / `is_sidepath:of:name=*` | Link sidepath ↔ parent road class/name |
| `oneway=yes\|no` (on cycleway) / `oneway:bicycle=*` (on road) | Bike travel direction vs road |

### B. Width / buffer (cross-section metres)

| Tag | Meaning (Berlin practice) |
| --- | --- |
| `cycleway:SIDE:width=*` / path `width=*` | Usable bike width = distance **between** boundary lines |
| `est_width=*` | Estimated when exact width unknown |
| `cycleway:SIDE:buffer:left\|right=*` / path `buffer:left\|right=*` | Buffer strip in metres **or** `yes`/`no`; **paint/hatching counted in buffer** |
| Road `width=*`, `lanes=*` | Carriageway context (door-zone / squeeze checks) |

Deep dive: [../../width-measurements/](../../width-measurements/).

### C. Separation / marking / adjacent mode (protected lanes)

Draft schema — full notes: [tags/separation-proposal.md](../tags/separation-proposal.md).

| Tag | Values / notes |
| --- | --- |
| `cycleway:SIDE:separation:left\|right=*` / path `separation:left\|right=*` | `no`, `bollard`, `vertical_panel`, `bump`, `planter`, `kerb`, `greenery`, … |
| `cycleway:SIDE:marking:left\|right=solid_line\|dashed_line` | Explicit paint style (proposal) |
| `cycleway:SIDE:traffic_mode:left\|right=*` / path `traffic_mode:*` | Adjacent mode: `motor_vehicle`, `parking`, `psv`, `foot`, `no` |

### D. Surface / colour (rendering + QA)

| Tag | Notes |
| --- | --- |
| `cycleway:SIDE:surface=*` / path `surface=*` | e.g. `asphalt`, `paving_stones` |
| `cycleway:SIDE:smoothness=*` / path `smoothness=*` | `excellent`…`very_bad` |
| `cycleway:SIDE:surface:colour=*` (alt. `:colour=*`) | Berlin: often `green`; junctions `red` |

### E. Access / signing (legal, not geometry)

| Tag | Notes |
| --- | --- |
| `bicycle=use_sidepath` / `optional_sidepath` / `no` | On **road** when sidepath exists |
| `bicycle:forward\|backward=use_sidepath` | Directional sidepath obligation |
| `cycleway:SIDE:traffic_sign=*` / path `traffic_sign=*` | e.g. `DE:237`, `none` (no obligation) |
| `oneway:bicycle=no` | Contraflow on oneway streets (replaces obsolete `cycleway=opposite`) |

### F. On-carriageway `:lanes` (centre / Mittellage bike lanes)

Wiki section “Radfahrstreifen in Mittellage” — same rules as [tags/bicycle-lanes.md](../tags/bicycle-lanes.md):

| Tag | Role |
| --- | --- |
| `lanes=*` | **Motor** full-width lanes only |
| `cycleway:lanes=*` | Per-slot cycleway role (`lane` / `no` / …) |
| `bicycle:lanes=*` | Per-slot bicycle access (`designated` / `yes` / `no`) |
| `vehicle:lanes=*` | Restrict cars on bike slots (`no` on designated bike) |
| `turn:lanes=*` | Turn arrows including bike slots in pipe count |
| `cycleway:SIDE=lane` | Still recommended **with** `:lanes` (many apps ignore `:lanes` alone) |

**Explicit wiki rule:** pipe count of `*:lanes` **includes** bike slots; `lanes=*` does **not** — same validation tension as OsmLaneVisualizer / iD #387.

### G. Road context (affects cross-section / safety, not bike strip itself)

| Tag | Why it matters for a lane editor |
| --- | --- |
| `parking:left\|right\|both=*` | Door-zone; often drives `traffic_mode=parking` / buffer:right |
| `maxspeed=*` | Context for protection quality |
| `traffic_sign=DE:277.1` (+ `:forward`/`:backward`) | No overtaking of single-track vehicles |
| `cycleway=asl` (node on road) | Advanced stop line / bike box |

### Out of primary lane-editor scope (page also covers)

Driveway crossings, `hazard:bicycle=*`, monitoring stations, pop-up `description:covid19=*`, `class:bicycle=*`, experimental `traffic=*`, complex junction signal mapping — useful fixtures/context, not core `:lanes` / cross-section keys.

## Editor implications

1. **Dual model:** Cross-section UI must show on-road `cycleway:SIDE=*` packages **and** know when to open/link a separate `highway=cycleway` (`=separate` + `is_sidepath`).
2. **Width maths:** Bike usable width ≠ buffer; buffer includes paint ([width-measurements](../../width-measurements/)).
3. **Mittellage:** Need full `:lanes` decompose (`bicycle`/`vehicle`/`cycleway`/`turn`) plus keep `cycleway:right=lane` for consumers that ignore `:lanes`.
4. **Fixture source:** Pair with [StreetComplete CyclewayParser](./_streetcomplete-cycleway-parser.md); extract exemplar way IDs from [#Tagging-Beispiele](https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege#Tagging-Beispiele) when building tests.
5. **Related consumer:** [Straßenraumkarte](./strassenraumkarte.md) renders many of these in Berlin Neukölln.

## Sources

- https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege
- https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege
- https://wiki.openstreetmap.org/wiki/Proposal:Separation
- https://github.com/a-b-street/abstreet/discussions/789
- [tags/bicycle-lanes.md](../tags/bicycle-lanes.md)
- [tags/separation-proposal.md](../tags/separation-proposal.md)
- [../../width-measurements/](../../width-measurements/)
