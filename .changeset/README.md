# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to version and publish packages under `@osm-editor-kit/*`.

## First npm alpha wave

These packages are intended for the first public alpha on npm:

- `@osm-editor-kit/osm-coverage`
- `@osm-editor-kit/osm-data`
- `@osm-editor-kit/osm-map-url`
- `@osm-editor-kit/osm-maplibre`
- `@osm-editor-kit/osm-route-snapper`
- `@osm-editor-kit/osm-way-chain`
- `@osm-editor-kit/street-imagery`
- `@osm-editor-kit/street-imagery-react`

## Other packages

All other workspace packages under `packages/*` also get changesets as we prepare them for eventual alpha releases. They remain private until we publish them.

The app (`@osm-editor-kit/street-space-editor`) is ignored — it is not published to npm.

## Usage

After merging changes, add a changeset describing what changed:

```bash
bunx changeset
```

Later, releases will be driven by `bun run packages:release` (not wired up yet). Until then, use `bunx changeset` to record version bumps.
