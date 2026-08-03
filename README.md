# Street Space Editor for OpenStreetMap

- [Open the editor](https://osmberlin.github.io/street-space-editor/?zoom=16&lat=52.4751&lng=13.4435)
- Learn more about the project [in the launch post](https://www.openstreetmap.org/user/acsd/diary/45026).

One app with a shared OSM shell (auth, fetch, changeset upload) and **modes** for visualization and editing:

| Mode | Status |
| --- | --- |
| Parking | Active |
| Width | Active |
| Bicycle | Active |
| Lanes | Planned |
| Surface | Active |
| Sidewalks | Planned |

Modes plug into `app/src/modes/`; the shell lives in `app/src/shell/`. Shared kit packages remain under `packages/*`.

**Deploy path:** Vite / GH Pages base is `/street-space-editor/`.

## Screenshots

Viewer:

<img src="https://i.imgur.com/VwH7Hmh.png" alt="Viewer UI">

Editor:

<img src="https://i.imgur.com/e0vsqUQ.png" alt="Editor UI">

# Using correct Node version

The correct Node version is specified in `.nvmrc`.

For an easy way to automatically use this Node version just for your current shell:

- Install `nvm`
  - Using the [install script](https://github.com/nvm-sh/nvm#install--update-script)
  - Or using [Homebrew](https://formulae.brew.sh/formula/nvm)
- Run `nvm use` to automatically use the Node version specified in the `.nvmrc`. You may need to
  `nvm install`.

## Development

From the repo root:

```sh
bun install
bun run dev
```

The Vite app lives in `app/` (`@osm-editor-kit/street-space-editor`). Run `bun run check` from the root before pushing.

**Dev OSM data:** In development, the app defaults to a local Berlin fixture served as OSM Map API bbox slices (`dev-osm-map-fixture`). Use the debug panel’s “Live OSM viewport fetch” toggle to hit the real OSM Map API instead. The fixture file is downloaded on `bun run dev` via `predev` if missing.

### Audit — how the app understands OSM data

Flat audit pages (no mode chrome) for reviewing interpretation rules and fixtures:

**Local (with `bun run dev`):**

- [Width audit](http://localhost:5173/street-space-editor/audit-width) — measure rules and tag relations
- [Lanes audit](http://localhost:5173/street-space-editor/audit-lanes) — cross-section / plan-sketch interpretation

**Deployed:**

- https://osmberlin.github.io/street-space-editor/audit-width
- https://osmberlin.github.io/street-space-editor/audit-lanes

## Install git hook

[Husky](https://github.com/typicode/husky) runs `bun run check-ci` on pre-push (see `.husky/pre-push`).
