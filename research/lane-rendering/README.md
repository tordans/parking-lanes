# Lane rendering (cartographic)

How to draw lanes, bike infrastructure, sidewalks, and crossings on a map in a way that is **geometrically plausible** yet **visually abstract** — starting from centreline road/lane data (short segments first).

| Document | Role |
|----------|------|
| [00-research-question.md](./00-research-question.md) | Evidence-bound literature + practice synthesis (academic-research skill) |
| [methods-catalogue.md](./methods-catalogue.md) | Algorithms, patterns, and **§7 web/React panel rendering** recommendations |
| [josm-turnlanes-renderer.md](./josm-turnlanes-renderer.md) | JOSM turnlanes plugin geometry — fillets, pocket tapers, junction clip (why wiki figures look “lane-style”) |

Related in this repo:

- Tag / project survey: [../lane-editor-tags/](../lane-editor-tags/) — especially [strassenraumkarte.md](../lane-editor-tags/projects/strassenraumkarte.md), [map-machine.md](../lane-editor-tags/projects/map-machine.md), [osm2streets.md](../lane-editor-tags/projects/osm2streets.md), [abstreet-osm-viewer.md](../lane-editor-tags/projects/abstreet-osm-viewer.md), [josm-turnlanes-core.md](../lane-editor-tags/projects/josm-turnlanes-core.md)
- Width semantics: [../width-measurements/](../width-measurements/)

**Implemented:** layout + SVG live in [`packages/osm-lane-diagram`](../../packages/osm-lane-diagram/) (`@osm-editor-kit/osm-lane-diagram`); browse fixtures at the app’s [`/audit-lanes/$demoId`](../../app/src/routes/audit-lanes/$demoId.tsx) gallery. **Current product approach (conceptual):** [lanes-road-space-approach.md](../../docs/lanes-road-space-approach.md).

**Search date:** 2026-07-29.
