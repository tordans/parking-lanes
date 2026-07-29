# 3DStreet

Design-reference note — web 3D street scenes; not an OSM `:lanes` tag editor.

## Overview

| Field | Value |
| --- | --- |
| **URL** | https://3dstreet.app |
| **Repo** | https://github.com/3DStreet/3dstreet |
| **Mentioned in** | [#789 stakeholder @kfarr](https://github.com/a-b-street/abstreet/discussions/789) |
| **Coverage** | Shallow — optional follow-up (OSM import path) |

## UX

Web 3D street scenes from Streetmix segment JSON + built-in templates; OSM/Google 3D Tiles context import for real-world setting.

## Tags touched

**None natively** — lane model is Streetmix segment types (`drive-lane`, `bike-lane`, `turn-lane`, …), not OSM `:lanes` schema. README lists segment support vs Streetmix.

## Editor implication

UX/schema adjacent (cross-section editing → 3D); any OSM integration is geospatial context, not tag round-trip. Related design refs: [_streetmix.md](./_streetmix.md), [_streetplan.md](./_streetplan.md).

## Sources

- https://github.com/3DStreet/3dstreet
- https://3dstreet.app
- https://github.com/a-b-street/abstreet/discussions/789
