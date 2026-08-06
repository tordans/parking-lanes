# JOSM Turn Lanes plugin (core / “turnlanes”)

Older JOSM plugin for editing **junction turn-lane relations** (`type=turnlanes:lengths` / `turnlanes:turns`) with a graphical junction view. Distinct from [turnlanes-tagging](./josm-turnlanes-tagging.md) (Mapbox-era `turn:lanes` tag editor).

**Fetched 2026-08-06.** Rendering deep dive (geometry that makes the wiki figures look smooth): [../../lane-rendering/josm-turnlanes-renderer.md](../../lane-rendering/josm-turnlanes-renderer.md).

| Field | Value |
|-------|-------|
| **Author** | Benjamin Schulz (benshu) |
| **Proposal** | [Proposal:Turn lanes (relation)](https://wiki.openstreetmap.org/wiki/Proposal:Turn_lanes_(relation)) — status **Obsoleted** |
| **Source** | [tsmock/turnlanes](https://github.com/tsmock/turnlanes) · [JOSM SVN](https://josm.openstreetmap.de/browser/osm/applications/editors/josm/plugins/turnlanes/) |
| **JAR** | Still listed: [turnlanes.jar](https://josm.openstreetmap.de/osmsvn/applications/editors/josm/dist/turnlanes.jar) |
| **Plugin link in POM** | Points at the proposal `#Plugin` section |
| **Superseded tagging** | Prefer `turn(:lanes)` + [Relation:connectivity](https://wiki.openstreetmap.org/wiki/Relation:connectivity) for new mapping |

---

## What it is / is not

| | turnlanes (this) | turnlanes-tagging |
|--|------------------|-------------------|
| Edits | Custom relations + lane lengths | `turn:lanes*` (and related) tags |
| UX | Dedicated junction GUI (asphalt plan view) | Preset / form style |
| Geometry | Real offset/fillet renderer | No lane polygon engine |
| Status | Schema obsolete; JAR still distributed | Active `turn:lanes` reference |

Which plugin [iD #387 (2023)](https://github.com/openstreetmap/iD/issues/387#issuecomment-1569456785) criticizes remains unclear — if the complaint is relation UX / complexity, it is likely **this** one; if tag editing, [turnlanes-tagging](./josm-turnlanes-tagging.md).

---

## Tagging model (proposal)

### Lengths — `type=turnlanes:lengths`

| Key / role | Meaning |
|------------|---------|
| `lengths:left` / `lengths:right` | Comma-separated metres, **inside → outside** |
| `end` | Junction node where pockets end |
| `ways` | Ordered path from that node along the approach |

Asymmetry by design: only **incoming** pocket lengths toward the junction, not outbound flares.

### Turns — `type=turnlanes:turns`

| Key / role | Meaning |
|------------|---------|
| `from` / `via` / `to` | Same spirit as turn restrictions; `via` may be ways for dual carriageways |
| `lanes` | Regular lane addresses (1…n left→right toward junction) |
| `lanes:extra` | Extra pocket addresses (`1…` right side; `-1…` left side) |
| `access` | Optional mode restriction |

Dual carriageways: select all crossing nodes + via ways so the GUI can edit multi-node junctions.

---

## Plugin UX (from wiki + source)

- Split ways at junction nodes; select junction (+ via ways) → graphical editor.
- “+” adds extra turn lanes; drag length slider on extras.
- Drag outgoing → incoming connectors to allow turns; Ctrl+A shows all turn strokes.
- Hotkeys: `+/-` zoom, Space recenter, F5 refresh, Ctrl+L/R rotate.

Videos (2011): [simple junction](http://www.youtube.com/watch?v=uF_ZuIwLruQ), [dual carriageway](http://www.youtube.com/watch?v=CwZgug_U-QY).

---

## Wiki figures vs live GUI

See [josm-turnlanes-renderer.md § Image provenance](../../lane-rendering/josm-turnlanes-renderer.md#image-provenance).

- [File:Turnlanes_gui.png](https://wiki.openstreetmap.org/wiki/File:Turnlanes_gui.png) — real screenshot.
- Lengths / turns / addressing PNGs — proposal illustrations with **extra annotations** (Way labels, dimension brackets, pavement arrows) on top of plugin-like asphalt geometry.

---

## Editor implications

1. **Do not revive `turnlanes:*` relations** as our write schema — obsolete; use `turn:lanes` + connectivity where needed ([turn-lanes.md](../tags/turn-lanes.md)).
2. **Do study the renderer** for junction fillets, approach clipping, and pocket tapers — that is why the figures look “lane-style” and connected.
3. Prefer [turnlanes-tagging](./josm-turnlanes-tagging.md) when researching how mappers edit `turn:lanes` today.

---

## Sources

- https://wiki.openstreetmap.org/wiki/Proposal:Turn_lanes_(relation)
- https://github.com/tsmock/turnlanes
- https://josm.openstreetmap.de/browser/osm/applications/editors/josm/plugins/turnlanes/src/org/openstreetmap/josm/plugins/turnlanes/gui/TurnLanesDialog.java
- https://community.openstreetmap.org/t/making-lanes-orthagonal-and-consistent/105033
