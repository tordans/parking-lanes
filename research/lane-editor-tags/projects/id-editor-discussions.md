# iD editor discussions — lane and turn-lane tagging

Timeline and synthesis of [openstreetmap/iD#387](https://github.com/openstreetmap/iD/issues/387) and related GitHub threads. Issue state: **open** (created 2013-01-11; last updated 2023-05-30).

---

## Executive summary

| Aspect | Consensus / status |
| --- | --- |
| **Goal** | Road style should reflect lanes; simplified lane tagging UI |
| **Merged feature** | **None** — PR [#3822](https://github.com/openstreetmap/iD/pull/3822) (2017) closed 2020 |
| **Design direction** | Evolved from **map overlays** → **sidebar cross-section** (Streetmix-like) → debate over unified vs separate UIs |
| **Minimum viable tags (2019)** | `lanes`, `turn:lanes` (+ `:forward`/`:backward`); destination tags debated |
| **Hard problems** | Way direction vs physical left/right; curved ways; `lanes` vs `*:lanes` count mismatch; separate ways per mode |
| **Open decisions** | Map vs sidebar vs both; scope (turn-only vs all street facets); connectivity editing |

---

## Timeline

### 2013 — Issue opened

- **@simonpoole** ([#387](https://github.com/openstreetmap/iD/issues/387)): Road style should reflect lane count/type; simplified lane tagging. Points to [Key:lanes](https://wiki.openstreetmap.org/wiki/Key:lanes) and [Key:turn](https://wiki.openstreetmap.org/wiki/Key:turn).
- **@simonpoole**: JOSM [lane_features](https://wiki.openstreetmap.org/wiki/Josm/styles/lane_features) style exists; OsmAnd has some navigation support.
- Labels added over time: `field`, `ui-fields`, `enhancement` → later `wip` → `wip` removed 2019.

**Cross-refs opened early:** [#2608](https://github.com/openstreetmap/iD/issues/2608), [#3082](https://github.com/openstreetmap/iD/issues/3082).

---

### 2016 — GSoC proposal and community design input

| Date | Author | Summary |
| --- | --- | --- |
| 2016-04-26 | @kepta | [GSoC proposal (Google Doc)](https://docs.google.com/document/d/1HOM4TCKk2Bvw0tiRHQEh8B7gGrZqrQxBO0vH1bJidHw) |
| 2016-04-27 | @slhh | Links [OsmLaneVisualizer live demo](http://osm.mueschelsoft.de/cgi-bin/render.pl?relref=B%2075&start=1&placement&adjacent&lanewidth&usenodes) and [interpreted tags](https://github.com/mueschel/OsmLaneVisualizer#interpreted-tags) |
| 2016-04-27–30 | @slhh | Detailed UX proposals: non-rectangular lanes, `width:lanes` + `placement` draggable line, temporary lane objects decomposing all `*:lanes` tags |
| 2016-04-30 | @slhh | Extend to `:forward`/`:backward` keys without `:lanes`; driving_side matters for value matching |
| 2016-04-30 | @pnorman | Questions `:lanes` vs `:lanes:forward` matching except for display |
| 2016-05-15 | @slhh | **`lanes=*` ≠ `*:lanes` pipe count** — editor should focus on `*:lanes`; `lanes` via normal fields |
| 2016-05-15 | @kepta / @bhousel | Acknowledge anomaly: `lanes` sometimes counts motorized-only lanes |
| 2016-05-15 | @slhh | Application-driven priorities: rendering needs `placement`, `width:lanes`; navigation needs `change:lanes` + connectivity (`transit` / relations) |
| 2016-05-16 | @HolgerJeromin | OsmAnd uses `turn:lane` for navigation |

**Tags in scope (2016 @slhh priority list):**

1. *First priority (special graphics):* `width:lanes`, `width:lanes:start`, `width:lanes:end`, `placement`, `placement:start`, `placement:end`, `change`, `change:lanes`
2. *Second priority (error-prone without graphics):* `turn`, `turn:lanes`, direction/`start`/`end` combinations
3. *Third priority:* remaining `*:lanes` via lane-based fields

---

### 2017 — Working prototype (map overlays)

| Date | Event |
| --- | --- |
| 2017-01-20 | @kepta demo GIF — turn lane icons on map |
| 2017-02-05 | Two-way demo GIF; **PR [#3822](https://github.com/openstreetmap/iD/pull/3822)** opened |
| 2017-02-05 | @slhh feedback: pointing (not circular) icons, resizable, hidden-property indicator, map-click selection |
| 2017-12-30 | @tordans: prefers OsmLaneVisualizer cross-section over map icons; [Axure wireframe](https://cyakew.axshare.com/#c=2) following iD field patterns; asks about `cycleway` complexity |

**PR #3822 tags (inferred from demos + PR):** `turn:lanes`, `turn:lanes:forward/backward`, `lanes`, `lanes:forward/backward`; map-overlay editing.

**PR #3822 outcome:** Stale by 2018; [@bhousel](https://github.com/openstreetmap/iD/pull/3822#issuecomment-404321234) — needs restart; closed 2020; [@1ec5](https://github.com/openstreetmap/iD/pull/3822#issuecomment-1001556786) — design moved to inspector field.

---

### 2018–2019 — Cross-section designs and scope debate

| Date | Author | Proposal |
| --- | --- | --- |
| 2018-08-27 | @1ec5 | Sidebar mini-editor inspired by OsmLaneVisualizer + [Streetmix](https://streetmix.net/) + [StreetPlan](http://streetplan.net/); [bhousel CodePen](https://codepen.io/bhousel/pen/jrVoNm); directionality mitigations (view cone, cross-street names, A⃝/B⃝ labels like Waze) |
| 2018-12-14 | @quincylvania | Sidebar mockups — click icons to cycle/pick; drag lanes/dividers |
| 2018-12-15 | @slhh | Map hover highlights lane on way; right-click add/delete lane; cross-streets often misleading |
| 2018-12-16 | @bhousel | Prefers rendering lanes on map at high zoom |
| 2018-12-17 | @1ec5 | Map overlay vs sidebar tradeoffs; `placement`/`change:lanes` hard as overlays |
| 2019-04-13 | @tordans | [#6178](https://github.com/openstreetmap/iD/issues/6178) parking UI — links [zlant/parking-lanes](https://zlant.github.io/parking-lanes/) |
| 2019-04-15 | @quincylvania | Updated mockup — lane click opens popover; sidewalks/bike/parking in lane editor |
| 2019-04-16 | @slhh | Animated dots on map for lane direction from `placement` + `width:lanes` |
| 2019-04-19 | @tordans | **Scope warning:** one UI for all lane facets may be impossible; proposes separate UIs or explicit feature list |
| 2019-04-19 | @quincylvania | Start with basic lane info (access, turns); not everything |
| 2019-04-19 | @tordans | **MVP tag set:** `lanes`, `turn:lanes` (+ forward/backward variants); asks about `destination:*` |
| 2019-04-20 | @BjornRasmussen | Prefer map + sidebar; optional lane rendering in Map Data |
| 2019-06-25 | @EmpireFall | Turn-restriction-box orientation (rotate with way) for lane tags |

**Tags explicitly debated in scope:**

| In scope (various commenters) | Out of scope / separate UI |
| --- | --- |
| `lanes`, `lanes:forward/backward` | `parking:lane` → [#6178](https://github.com/openstreetmap/iD/issues/6178) |
| `turn:lanes` (+ directional) | Full `cycleway` left/right complexity |
| `destination:lanes` (maybe popover) | All Streetmix facets (tram, trees, bollards) in v1 |
| `change:lanes`, `access:lanes`, `hov:lanes` (@1ec5 2018) | Connectivity relations / `transit` (later phase) |
| `width:lanes`, `placement` (+ `:start`/`:end`) | |
| `maxspeed:lanes` (@ignaciolep 2019) | |

**Linked external projects (from comments):**

| Project | URL | Tags discussed |
| --- | --- | --- |
| OsmLaneVisualizer | http://osm.mueschelsoft.de/cgi-bin/render.pl | Broad `*:lanes`, placement, destination |
| Streetmix | https://streetmix.net/ | Conceptual (no OSM tags) |
| StreetPlan | http://streetplan.net/ | Conceptual |
| bhousel SVG mockup | https://codepen.io/bhousel/pen/jrVoNm | Cross-section |
| zlant parking-lanes | https://zlant.github.io/parking-lanes/ | `parking:lane:*` |
| @tordans wireframe | https://cyakew.axshare.com/#c=2 | iD field pattern for lanes |
| kepta GSoC doc | https://docs.google.com/document/d/1HOM4TCKk2Bvw0tiRHQEh8B7gGrZqrQxBO0vH1bJidHw | Turn lanes (not fetched) |

---

### 2021–2023 — Stagnation and external experiments

| Date | Event |
| --- | --- |
| 2021-02-10 | @hungerburg asks if WIP removal means feature complete; @kymckay clarifies work stopped |
| 2021-10-05 | @hungerburg asks if @quincylvania mockups are open source — no repo cited |
| 2023-05-30 | @machineonamission bumps issue; criticizes JOSM turn lane plugin |
| 2023-05-30 | @dabreegster links [osm2streets lane editor](https://a-b-street.github.io/osm2streets/lane_editor.html) + [osm2streets#216](https://github.com/a-b-street/osm2streets/issues/216) |

---

## Proposed UX patterns (catalog)

1. **Map overlay icons** (kepta 2017, existing iD turn-lane field) — quick visual check; distracting per @1ec5/@tordans.
2. **Sidebar cross-section** (OsmLaneVisualizer, Streetmix, quincylvania, BjornRasmussen) — compact multi-facet view; direction confusion on N–S ways.
3. **Decomposed lane objects** (@slhh) — select lane → edit tags in “lane fields” / “lane tags”; reassemble `*:lanes` on deselect.
4. **Divider editing** (@BjornRasmussen) — click lane marking for `change:lanes`.
5. **Turn-restriction-style box** (@EmpireFall) — rotate diagram with way bearing.
6. **A⃝ / B⃝ endpoint labels** (@1ec5, Waze-inspired) — disambiguate direction without cross-street names.
7. **Map lane rendering at high zoom** (@bhousel) — edit lanes on map directly.
8. **Separate micro-editors per facet** (@tordans) — turn lanes, parking ([#6178](https://github.com/openstreetmap/iD/issues/6178)), bike lanes.

---

## Open decisions (as of last activity, 2023)

| Decision | Positions |
| --- | --- |
| **Unified vs separate UIs** | @bhousel wants one “street stuff” place ([#6178](https://github.com/openstreetmap/iD/issues/6178#issuecomment-482986614)); @tordans/@1ec5 favor focused editors |
| **Map vs sidebar** | Both preferred by several; @bhousel leans map-only rendering |
| **MVP tag set** | @quincylvania: access + turns first; @tordans: `lanes` + `turn:lanes` only for v1 |
| **`lanes` vs `*:lanes`** | Editor should not force equality (@slhh); validator warnings discussed in [#8964](https://github.com/openstreetmap/iD/issues/8964) |
| **Connectivity** | `transit` proposal vs connectivity relations vs infer from `width:lanes:start/end` — no iD implementation |
| **Destination lanes** | Likely too complex for main UI (@BjornRasmussen 2019) |
| **Integration path** | osm2streets lane editor offered as external iteration surface (2023) |

---

## Related iD issues and PRs

| # | Title | Relation to #387 |
| --- | --- | --- |
| [#3822](https://github.com/openstreetmap/iD/pull/3822) | Lanes (PR) | Implementation attempt; closed |
| [#5674](https://github.com/openstreetmap/iD/issues/5674) | Turn lanes reversed when reversing way | Bug: `left`↔`right` wrongly flipped in `turn:lanes` on way reverse; fixed [#5826](https://github.com/openstreetmap/iD/pull/5826) |
| [#5828](https://github.com/openstreetmap/iD/issues/5828) | Reversing oneway with turn:lanes | Follow-up |
| [#6178](https://github.com/openstreetmap/iD/issues/6178) | Parking alongside streets | Parallel UI for `parking:lane`; links #387 |
| [#6485](https://github.com/openstreetmap/iD/issues/6485) | Divide highway operation | Referenced from #387 |
| [#6571](https://github.com/openstreetmap/iD/issues/6571) | Graphical interface expansion proposal | Referenced from #387 |
| [#7700](https://github.com/openstreetmap/iD/issues/7700) | Render sidewalk & verge | Referenced from #387 |
| [#1762](https://github.com/openstreetmap/iD/issues/1762) | Sidewalk tag on highways | Cycleway field pattern cited for parking |
| [#8630](https://github.com/openstreetmap/iD/issues/8630) | Field type for directional subkeys | Referenced from #387 |
| [#8964](https://github.com/openstreetmap/iD/issues/8964) | Warn if lanes:forward+backward ≠ lanes | Validator |
| [#9212](https://github.com/openstreetmap/iD/issues/9212) | Cycleway:both ignored | Bike lane field complexity |
| [#9476](https://github.com/openstreetmap/iD/issues/9476) | Field “look at sibling tags” | Lane editor field architecture |
| [#10736](https://github.com/openstreetmap/iD/issues/10736) | Reversing way changes red turn | Turn lane rendering |
| [#11159](https://github.com/openstreetmap/iD/issues/11159) | Lane count dependent features | Assistive validation |
| [#11564](https://github.com/openstreetmap/iD/issues/11564) | Render sidewalk and cycleway on street | Rendering |
| [#11938](https://github.com/openstreetmap/iD/issues/11938) | Lane visualizer NaN (closed wontfix) | **No lane UI in iD** — reporter confused validator code with #387 feature |
| [#12005](https://github.com/openstreetmap/iD/pull/12005) | Related subtags in inspector | Mentions lane editor as future custom field |
| [#2608](https://github.com/openstreetmap/iD/issues/2608) | Tabulation for complex input | Early cross-ref |
| [#3082](https://github.com/openstreetmap/iD/issues/3082) | Fields define whole properties | Early cross-ref |

**External cross-refs:**

| # | Repo | Title |
| --- | --- | --- |
| [#94](https://github.com/openstreetmap/iD/issues/94) | (project board) | Explore iD integration |
| [#1465](https://github.com/openstreetmap/iD/issues/1465) | (project board) | Lane editor |
| [#1202](https://github.com/openstreetmap/iD/issues/1202) | id-tagging-schema | Field groups in presets |
| [#216](https://github.com/a-b-street/osm2streets/issues/216) | osm2streets | OSM auth for lane editor |

---

## Source index (all GitHub URLs cited)

### Primary

- https://github.com/openstreetmap/iD/issues/387

### PRs

- https://github.com/openstreetmap/iD/pull/3822
- https://github.com/openstreetmap/iD/pull/5826
- https://github.com/openstreetmap/iD/pull/12005

### Issues (iD)

- https://github.com/openstreetmap/iD/issues/94
- https://github.com/openstreetmap/iD/issues/1202
- https://github.com/openstreetmap/iD/issues/1465
- https://github.com/openstreetmap/iD/issues/1762
- https://github.com/openstreetmap/iD/issues/2608
- https://github.com/openstreetmap/iD/issues/3082
- https://github.com/openstreetmap/iD/issues/5674
- https://github.com/openstreetmap/iD/issues/5828
- https://github.com/openstreetmap/iD/issues/6178
- https://github.com/openstreetmap/iD/issues/6485
- https://github.com/openstreetmap/iD/issues/6571
- https://github.com/openstreetmap/iD/issues/7700
- https://github.com/openstreetmap/iD/issues/8630
- https://github.com/openstreetmap/iD/issues/8964
- https://github.com/openstreetmap/iD/issues/9212
- https://github.com/openstreetmap/iD/issues/9476
- https://github.com/openstreetmap/iD/issues/10736
- https://github.com/openstreetmap/iD/issues/11159
- https://github.com/openstreetmap/iD/issues/11564
- https://github.com/openstreetmap/iD/issues/11938

### Issues (other repos)

- https://github.com/a-b-street/osm2streets/issues/216
- https://github.com/a-b-street/osm2lanes/issues/240
- https://github.com/osmandapp/OsmAnd/issues/12481

### Key comment permalinks (iD #387)

- https://github.com/openstreetmap/iD/issues/387#issuecomment-215444634 (slhh → OsmLaneVisualizer)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-220456894 (lanes vs *:lanes)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-277539927 (kepta demo)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-278999376 (tordans → OsmLaneVisualizer + wireframe)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-415456769 (1ec5 → Streetmix/StreetPlan)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-447620208 (quincylvania mockup)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-483289342 (quincylvania update)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-483702193 (BjornRasmussen divider UI)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-484789342 (tordans scope)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785 (2023 bump)
- https://github.com/openstreetmap/iD/issues/387#issuecomment-156946947 (dabreegster osm2streets)

### Non-GitHub sources referenced in thread

- https://docs.google.com/document/d/1HOM4TCKk2Bvw0tiRHQEh8B7gGrZqrQxBO0vH1bJidHw (kepta GSoC)
- http://osm.mueschelsoft.de/cgi-bin/render.pl?relref=B%2075&start=1&placement&adjacent&lanewidth&usenodes
- https://cyakew.axshare.com/#c=2
- https://codepen.io/bhousel/pen/jrVoNm
- https://streetmix.net/
- http://streetplan.net/
- https://zlant.github.io/parking-lanes/
- https://a-b-street.github.io/osm2streets/lane_editor.html

### Later live sidebar implementation (outside this thread)

- [kyle-kiwi-id-lanes.md](./kyle-kiwi-id-lanes.md) — Kyle Hensel’s iD fork hosts a **Lane Editor** plugin (React cross-section, read-only as of 2026-08) backed by [osm-lane-parser](https://github.com/k-yle/osm-lane-parser). Live: https://kyle.kiwi/iD
