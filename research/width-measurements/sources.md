# Sources — OSM width measurements

Source index for [README.md](./README.md) (width deep dive). Fetched or read **2026-07-26**.

Related: [lane-editor-tags](../lane-editor-tags/) for `:lanes` / tool parser research.

## Method

1. Prefer **EN Key:width** “Width of streets” as normative carriageway definition; use **DE** pages for `:lanes` / Radwege practice.
2. Treat **Berlin/Verkehrswende** pages as strong regional practice for cycle width + buffer (including paint-in-buffer), not yet global proposal status for all keys.
3. Cross-check **tool behaviour** (StreetComplete, muv-osm, Straßenraumkarte) for what editors/parsers actually do.
4. Mark **clear vs situational** in the deep dive; do not invent wiki consensus where Talk/ML left ambiguity. For motor `width:lanes` vs paint, document an explicit **logical assumption** (clear between markings) when it follows from Berlin cycle practice + kerb→kerb `width=*`, and label it as assumption rather than wiki text.

---

## A. OSM Wiki — English

| Page | Summary |
|------|---------|
| [Key:width](https://wiki.openstreetmap.org/wiki/Key:width) | Units; estimated vs exact; **Width of streets**: kerb→kerb includes on-street parking + cycle lanes, excludes sidewalks / off-kerb paths; lists `width:carriageway`, side widths, `width:lanes`, `width:effective`; notes historical fuzziness for consumers. |
| [Talk:Key:width](https://wiki.openstreetmap.org/wiki/Talk:Key:width) | Sidewalk-in-width debate (2013); Supaplex030 draft that became the streets section (2020); measuring methods; **use minimal width** along variable ways for routers (2024). |
| [Key:est_width](https://wiki.openstreetmap.org/wiki/Key:est_width) | Estimated width; same value rules as `width=*`. |
| [Key:maxwidth](https://wiki.openstreetmap.org/wiki/Key:maxwidth) | Legal maximum vehicle width (signed); not feature width. |
| [Key:maxwidth:physical](https://wiki.openstreetmap.org/wiki/Key:maxwidth:physical) | Physical clearance limit (bridges, barriers); no sign required. |
| [Lanes](https://wiki.openstreetmap.org/wiki/Lanes) | `*:lanes` schema; `width:lanes` = actual per-lane width; `maxwidth:lanes` = legal; pipe order; bike slots included in pipes but not in `lanes=*`; taper example with `width:lanes:start`. |
| [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) | Motor lane count; excludes bike/parking/shoulder (with noted unsettled edge cases). |
| [Key:cycleway:buffer](https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer) | Space between cycleway and car lanes when cycleway is tagged on the road; **`yes`/`no` dominate**; numeric metres allowed but uncommon globally. |
| [Tag:cycleway=lane](https://wiki.openstreetmap.org/wiki/Tag:cycleway%3Dlane) | Buffered lanes via `cycleway:buffer`; paint-only vs protected (separation). |
| [Key:narrow](https://wiki.openstreetmap.org/wiki/Key:narrow) | Relative narrowing (`narrow=yes`); combine with `width=*`. |
| [Tag:hazard=road_narrows](https://wiki.openstreetmap.org/wiki/Tag:hazard%3Droad_narrows) | Signed / notable road-narrows hazard. |
| [Key:lane_markings](https://wiki.openstreetmap.org/wiki/Key:lane_markings) | Whether lanes are painted; see-also points at `width` / `width:lanes` / `width:carriageway`. |
| [Sidewalks](https://wiki.openstreetmap.org/wiki/Sidewalks) | Pedestrian infrastructure; with/without sidewalks tag **`verge=*`** + **`verge:width=*`**; same pedestrian-fallback idea for **`shoulder=*`** beyond motorways. |
| [Key:verge](https://wiki.openstreetmap.org/wiki/Key:verge) | Verge presence (`yes`/`left`/`right`/`both`/`no`/`separate` + sided `verge:*=`); **`verge:*:width`** (metres or feet); optional area mapping with `verge=yes`. |
| [Key:shoulder](https://wiki.openstreetmap.org/wiki/Key:shoulder) | Shoulder presence/width; Sidewalks notes pedestrian use where available off motorways. |
| [Proposal:Separation](https://wiki.openstreetmap.org/wiki/Proposal:Separation) | Draft separation/marking; buffer widths as companion quality; `barred_area` marking ↔ buffer. |
| [File:Radweg Edinburger Straße beschriftet.jpg](https://wiki.openstreetmap.org/wiki/File:Radweg_Edinburger_Stra%C3%9Fe_beschriftet.jpg) | Mapillary-based labelled width photo (Berlin); used on meetup/Radwege pages; 2025 “fix buffer left” revision. |

## B. OSM Wiki — German / Berlin

| Page | Summary |
|------|---------|
| [DE:Key:width](https://wiki.openstreetmap.org/wiki/DE:Key:width) | Units, mistakes, `est_width`, `maxwidth` vs `maxwidth:physical`. **Missing** EN-equivalent “Breite von Straßen” section — use EN for kerb semantics. |
| [DE:Fahrspuren](https://wiki.openstreetmap.org/wiki/DE:Fahrspuren) | `:lanes` = all flowing-traffic lanes (incl. bikes); `lanes=*` = motor only; `width:lanes` = physical, `maxwidth:lanes` = legal; parking **not** a `:lanes` slot. |
| [Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege) | Extended cycle schema: `cycleway:*:width` = distance between boundary lines; `cycleway:*:buffer:*` = metres or yes/no; examples with widths; FAQ on `lanes` vs `:lanes`. |
| [Verkehrswende-Meetup/Radwege](https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege) | Meetup mirror / working page for the same schema; linked from labelled Edinburger file usage. |
| [Talk:Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Talk:Berlin/Verkehrswende/Radwege) | Invitation for constructive discussion before broader proposal (schema still evolving). |

## C. Mailing lists / GitHub / community

| Source | Summary |
|--------|---------|
| [[Tagging] "width" on streets: Time for a recommendation](https://lists.openstreetmap.org/pipermail/tagging/2020-September/055362.html) (Supaplex030, Sep 2020) | Opens three options; argues for **kerb→kerb including on-street parking**, component tags for the rest. Thread → wiki “Width of streets”. |
| [Replies in same thread](https://lists.openstreetmap.org/pipermail/tagging/2020-September/thread.html) (e.g. [dieterdreist](https://lists.openstreetmap.org/pipermail/tagging/2020-September/055364.html), [carnildo](https://lists.openstreetmap.org/pipermail/tagging/2020-September/055372.html), [Jeroen Hoek](https://lists.openstreetmap.org/pipermail/tagging/2020-September/055399.html)) | Agree option 2 for urban kerbs; exclude separate tracks from highway `width`; rural/unpaved definitions diverge; NL BGT/aerial makes kerb measure easy. |
| [StreetComplete #5593](https://github.com/streetcomplete/StreetComplete/issues/5593) | `width` quest fires despite existing `width:lanes`. **westnordost:** tags answer different questions; gutters ≈0.2–0.5 m; closing **wontfix** — recording both can help consumers. Clarifies `:lanes` includes bike, not parking. |
| Changeset cited in #5593 | https://www.openstreetmap.org/changeset/149289513 — example of SC adding `width` where `width:lanes` already existed. |

## D. Tools (width focus)

| Source | Summary |
|--------|---------|
| [muv-osm research](../lane-editor-tags/projects/muv-osm.md) | Parser: `width`/`est_width`/`width:carriageway` distribute; `width:lanes` per slot; numeric `cycleway:*:buffer` → width-only separator lane; **no paint model**. |
| muv `highway.rs` `carriageway_width` / `lane_widths` test | `width=8` + parking width + bike/vehicle lanes → remaining metres split across travel lanes. |
| muv `side_lanes.rs` `cycleway_buffer` test | `cycleway:left:buffer=0.2`, `cycleway:right:buffer=0.75` become buffer lane widths. |
| [Straßenraumkarte micromap post](https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update) | Production consumer of `width:lanes`, cycle buffers, defaults 3.0/1.5/2.2 m. |
| [Straßenraumkarte project note](../lane-editor-tags/projects/strassenraumkarte.md) | Offset pipeline; soft consistency expectations for an editor. |
| [JOSM lane_features](../lane-editor-tags/projects/josm-lane-features.md) | Default 3.5 m × `lanes` when `width` absent. |
| StreetMeasure / SC measuring | Documented on Key:width; ARCore provenance via `source:width`. |

## E. External / survey references (measurement convention)

| Source | Summary |
|--------|---------|
| [era-buffer-includes-paint.png](./assets/era-buffer-includes-paint.png) | German design cross-section: buffer ≥1.00 m **includes** 0.12 + hatch + 0.25 paint; cycle ≥2.00 after wide line. Anchors “Markierungen mitgezählt” for **buffer**. |
| [era-markings-stack.png](./assets/era-markings-stack.png) | Stacked marking dimensions (≥2.00 / 0.63 / 2.25) relative to solid/dashed lines — how standards seat measurements on paint edges. |
| [infrad-geometry-left-edge.png](./assets/infrad-geometry-left-edge.png) | infraD inventory guidance: geometry from **left edge of RVA**; width measured from that edge. |
| User note (meetup / Berlin practice) | `(cycleway:SIDE:)buffer:SIDE=<m>\|no` — see Breite; **ABER: Hier werden die Markierungen mitgezählt!** |

These ERA/infraD materials are **not** OSM tagging proposals; they justify how Berlin numeric buffers and cycle widths should be surveyed so OSM values match on-street design language.

## F. Related notes in lane-editor-tags

| Note | Width-relevant takeaway |
|------|-------------------------|
| [width-and-surface.md](../lane-editor-tags/tags/width-and-surface.md) | Short tag card; points here for deep dive |
| [bicycle-lanes.md](../lane-editor-tags/tags/bicycle-lanes.md) | `cycleway:*:width` / buffer / separation |
| [lanes-count.md](../lane-editor-tags/tags/lanes-count.md) | What enters `lanes=*` vs `:lanes` pipes |
| [separation-proposal.md](../lane-editor-tags/tags/separation-proposal.md) | Buffer as companion to separation/marking |
| [placement.md](../lane-editor-tags/tags/placement.md) | Centreline vs cross-section; tapers with width:lanes:start/end |
| [markings-and-change.md](../lane-editor-tags/tags/markings-and-change.md) | Paint meaning (`change`, `lane_markings`), not millimetres |

---

## Coverage checklist (research questions)

| Research question | Primary sources | Status |
|-------------------|-----------------|--------|
| `width` vs parking / sidewalks | Key:width, tagging ML 2020, Talk | **Documented** |
| `width` vs `width:lanes` | Key:width, Lanes, SC #5593, DE:Fahrspuren | **Documented** |
| Paint in motor lane widths | — (wiki silent) | **Logical assumption:** clear between markings; paint added in reconciliation formula (§2.2) |
| Paint in cycle width | Berlin Radwege (“zwischen Begrenzungslinien”) | **Documented (DE practice)** |
| Paint in buffer | ERA drawing + meetup note | **Documented (DE practice)** |
| `maxwidth` / `maxwidth:physical` | Key pages, DE:Key:width | **Documented** |
| Narrowings | Key:narrow, hazard=road_narrows, Talk min-width | **Documented** |
| Full ROW / median green | Sidewalks, Key:verge, Key:width | **Documented components** (`sidewalk:*:width`, `verge`/`verge:*:width`); **no aggregate** ROW key |
| Parser behaviour | muv-osm, Straßenraumkarte | **Documented** |
