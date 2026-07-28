# Changelog

All notable changes to the Street Space Editor app are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The product version lives in `app/package.json` and is shown in the Info panel and OSM
changeset `created_by` tag. Continuous GitHub Pages deploys do **not** bump this version
on every commit — bump intentionally when cutting a named release (see README → Releasing).

## [Unreleased]

## [0.9.0] - 2026-07-28

### Added

- Version and build date in the Info panel (from `app/package.json` + git HEAD date).
- Changeset metadata: `created_by` with version, `host`, session-scoped `imagery_used`, and Berlin wiki link on comments.
