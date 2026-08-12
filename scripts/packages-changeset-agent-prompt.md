# Changeset rewrite task

You are editing **one** Changesets file in this monorepo. Do **not** commit, push, or run other scripts.

## File to edit

`{{CHANGESET_PATH}}`

## Rules

1. Keep the YAML frontmatter exactly as-is (every package stays `patch`).
2. Rewrite **only** the markdown body below the frontmatter.
3. Structure the body with one short section per package (use the package name as a heading or bold lead-in).
4. For each package, write 1–4 **user-facing** bullets: what consumers get or can do after this lands. Finish-work tone (outcomes), not file lists, symbol names, or “updated X.ts”.
5. Use the package diffs and commit notes below as evidence. Drop internal-only noise unless there is no user-visible change (then one maintainer bullet is ok).
6. Do not edit any other files. Do not run `git commit` or `git push`.

## Packages and evidence

{{PACKAGE_EVIDENCE}}
