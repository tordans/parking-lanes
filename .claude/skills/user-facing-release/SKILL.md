---
name: user-facing-release
description: >-
  Cut a named Street Space Editor product release: audit commits since the last
  version, draft user-facing CHANGELOG notes, recommend and apply a semver bump,
  bump app/package.json, finish-work commit, push, tag, and GitHub Release. Use
  when releasing, cutting a release, bumping the editor version, writing the
  product changelog, or tagging vx.y.z.
disable-model-invocation: true
---

# User-facing release (Street Space Editor)

Named product version for Info panel + OSM `created_by`. Continuous Pages deploy on `main` does **not** bump the version — only this workflow does.

Related: [finish-work](../finish-work/SKILL.md) · [README Releasing](../../../README.md) · [CHANGELOG.md](../../../CHANGELOG.md)

## Checklist

```
- [ ] 1. Resolve range since last released version
- [ ] 2. List commits; filter to user-facing changes
- [ ] 3. Draft changelog bullets (categories + wording; version TBD)
- [ ] 4. Recommend bump from those changes; use it (user may override)
- [ ] 5. Write CHANGELOG.md section with chosen X.Y.Z
- [ ] 6. Bump app/package.json "version"
- [ ] 7. finish-work (check + commit version + changelog together)
- [ ] 8. Push to remote
- [ ] 9. Tag vx.y.z and create GitHub Release from that section
```

Do **not** bump for internal-only work (refactors, tests, deps, CI) with no mapper-visible effect. Land those on `main` without a version bump. If triage finds **no** user-facing changes, stop and say so — do not invent a release.

## Step 1: Range since last release

Prefer the latest dated section in `CHANGELOG.md` (e.g. `## [0.9.0] - …`), not `[Unreleased]`.

```bash
# Last released version from changelog (first ## [x.y.z] heading)
PREV=$(grep -m1 -E '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' CHANGELOG.md | sed -E 's/^## \[([^]]+)\].*/\1/')
```

Practical default:

1. If tag `v${PREV}` exists → `FROM=v${PREV}`
2. Else → find the commit that introduced `## [${PREV}]` / bumped to that version (`git log -S'"version": "'${PREV}'"' -- app/package.json` or ask the user)
3. Range: `git log "${FROM}"..HEAD`

First release / unclear boundary: ask the user for a start tag, SHA, or date. Do not guess a huge history.

## Step 2: Commit list → user-facing filter

```bash
git log "${FROM}"..HEAD --no-merges --reverse \
  --format='%h%n%s%n%b%n---'
```

**Include** when mappers can see, do, or understand something differently (modes, map, save/upload, auth, tagging, visible bugfixes, Info/version UX).

**Omit** refactors, tests, types, deps, CI, format-only, research-only, developer docs — unless the message clearly states user-visible impact.

Merge several commits about the same change into **one** changelog bullet. Prefer commit subject/body; open the diff only when unclear.

## Step 3: Draft changelog bullets

Keep a Changelog categories: `Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security` — only those that apply.

Draft the bullet list **before** picking the version number. Bullets are **user/mapper outcomes** in English — not file lists or impl details. Same spirit as finish-work commit bodies.

Fold in any ready items already under `## [Unreleased]`.

Briefly show the drafted bullets (and what you omitted) so the user can correct wording before the bump decision sticks in the file.

## Step 4: Recommend bump — then use it

Read current version from `app/package.json`. From the **drafted user-facing bullets**, pick:

| Bump | When |
|------|------|
| **patch** | Bug fixes, copy, small polish only |
| **minor** | New mode capability or notable UX (default when anything substantive ships) |
| **major** | Breaking OSM tagging or auth/API behaviour |

**Default: apply your recommendation** and compute `X.Y.Z` from current `app/package.json`. State the choice in one line (e.g. “Recommending **minor** → `0.10.0` because …”).

Do **not** wait for confirmation unless the user already asked to review the bump, the choice is ambiguous (patch vs minor), or they intervene mid-flow. If they override, use their bump.

## Step 5: Write CHANGELOG.md

1. Leave an empty `## [Unreleased]` at the top.
2. Insert below it:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- …

### Fixed
- …
```

Use today's date (`YYYY-MM-DD`) and the bullets from Step 3.

## Step 6: Bump version

Set `"version"` in `app/package.json` to `X.Y.Z`. That value is injected at build into Info panel, `created_by`, and User-Agent — no separate constant to edit.

## Step 7: finish-work

Invoke [finish-work](../finish-work/SKILL.md): `bun run check`, fix, commit **both** `CHANGELOG.md` and `app/package.json` (plus any check fixes) together.

Suggested commit shape:

```
Release: Street Space Editor X.Y.Z

- <one-line summary of why this cut exists>
- Changelog: <n> user-facing notes since Y.Y.Y
```

## Step 8: Push

finish-work does **not** push. After a successful commit:

```bash
git push -u origin HEAD
```

If not on `main`/`master`, push the branch and open/update a PR instead of tagging from a side branch unless the user asked to release from that branch after merge.

## Step 9: Tag + GitHub Release

Only after the release commit is on the default branch (merged if needed):

```bash
git tag "vX.Y.Z"
git push origin "vX.Y.Z"
gh release create "vX.Y.Z" --title "Street Space Editor X.Y.Z" --notes-file - <<'EOF'
## What's changed

<paste the ## [X.Y.Z] section body from CHANGELOG.md>
EOF
```

If `gh` fails or the user deferred tagging, stop after push and report the exact tag/release commands left to run.

## Done when

- [ ] `app/package.json` version is `X.Y.Z`
- [ ] `CHANGELOG.md` has `## [X.Y.Z] - YYYY-MM-DD` with user-facing bullets
- [ ] Release commit is pushed
- [ ] `vX.Y.Z` tag exists on the remote (and GitHub Release, unless deferred)
- [ ] Next Pages deploy will show `X.Y.Z` in Info and on new changesets
