# Street Space Editor for OpenStreetMap

- [Open the editor](https://osmberlin.github.io/street-parking-editor/?zoom=16&lat=52.4751&lng=13.4435)
- Learn more about the project [in the launch post](https://www.openstreetmap.org/user/acsd/diary/45026).

One app with a shared OSM shell (auth, fetch, changeset upload) and **modes** for visualization and editing:

| Mode | Status |
| --- | --- |
| Parking | Active |
| Width | Planned |
| Lanes | Planned |
| Surface | Planned |
| Sidewalks | Planned |

Modes plug into `app/src/modes/`; the shell lives in `app/src/shell/`. Shared kit packages remain under `packages/*`.

**Deploy path:** GH Pages currently serves `/street-parking-editor/` (Vite `base`). A rename to `/street-space-editor/` needs a redirect or updated Pages config before changing `app/vite.config.ts`.

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

## Install git hook

[Husky](https://github.com/typicode/husky) runs `bun run check-ci` on pre-push (see `.husky/pre-push`).
