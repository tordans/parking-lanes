/**
 * Bun can keep a stale `file:` install of `@tilda-geo/bicycle-infrastructure` when
 * that package's version does not bump while new source files are added. The cached
 * tree then misses modules (e.g. `analyze-category-gaps.ts`) and breaks type-check /
 * sidepath tests. Detect that and force a reinstall.
 */
import { access, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(appRoot, '..')
const requiredRelative = path.join('src', 'categories', 'analyze-category-gaps.ts')

async function resolvePackageRoot(): Promise<string | null> {
  try {
    const require = createRequire(path.join(appRoot, 'package.json'))
    const pkgJson = require.resolve('@tilda-geo/bicycle-infrastructure/package.json')
    return path.dirname(pkgJson)
  } catch {
    try {
      const require = createRequire(path.join(repoRoot, 'packages/osm-sidepath-tags/package.json'))
      const pkgJson = require.resolve('@tilda-geo/bicycle-infrastructure/package.json')
      return path.dirname(pkgJson)
    } catch {
      return null
    }
  }
}

async function clearStaleBunCaches() {
  const bunDir = path.join(repoRoot, 'node_modules', '.bun')
  let entries: string[]
  try {
    entries = await readdir(bunDir)
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.startsWith('@tilda-geo+bicycle-infrastructure@')) continue
    await rm(path.join(bunDir, entry), { recursive: true, force: true })
    console.log(`Removed stale Bun cache: ${entry}`)
  }
}

async function main() {
  const pkgRoot = await resolvePackageRoot()
  if (pkgRoot == null) {
    console.warn('@tilda-geo/bicycle-infrastructure is not installed yet; skipping ensure')
    return
  }

  const requiredFile = path.join(pkgRoot, requiredRelative)
  try {
    await access(requiredFile)
    return
  } catch {
    // stale or incomplete install
  }

  console.warn(
    `@tilda-geo/bicycle-infrastructure is missing ${requiredRelative}; clearing Bun file: cache and reinstalling`,
  )
  await clearStaleBunCaches()

  const proc = Bun.spawn(['bun', 'install'], {
    cwd: repoRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`bun install failed with exit code ${exitCode}`)
  }

  const refreshedRoot = await resolvePackageRoot()
  if (refreshedRoot == null) {
    throw new Error('@tilda-geo/bicycle-infrastructure still missing after reinstall')
  }
  await access(path.join(refreshedRoot, requiredRelative))
  console.log('Restored complete @tilda-geo/bicycle-infrastructure install')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to ensure @tilda-geo/bicycle-infrastructure: ${message}`)
  process.exit(1)
})
