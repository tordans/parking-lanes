---
"@osm-editor-kit/osm-editor-links": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- Shared constants for OSM prod/dev hosts, JOSM remote control, OSMCha, TILDA geo, and OSM Deep History
- OSM type helpers and osm.org links for elements, history pages, and changesets
- Web editor deeplinks: hosted iD, osm.org iD, Rapid, Kyle Kiwi iD, and JOSM `load_object` / import
- TILDA-style editor URL template placeholder filling and JOSM link-click remote-control handler
- OSM API map download URL from viewport bbox (prod or dev server)
- Mapillary viewport links with optional date, traffic-sign, and pano filters plus a recent-panoramas preset
- OSM Deep History viewer URLs for an OSM element
- OSMCha changeset and JSON `filters=` deep links
- TILDA inspector URLs (map/config/`f`), bikelanes/parking infra presets, `f` feature param serialization, and source numeric ID registry
