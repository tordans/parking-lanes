#!/usr/bin/env bun
/**
 * Publish-ready check + npm publish for first-wave @osm-editor-kit packages.
 *
 * Prepare steps are separate — see .changeset/README.md.
 *
 * Usage:
 *   bun run packages:release
 *   bun run packages:release -- --dry-run
 *   bun run packages:release -- --yes
 *   bun run packages:check
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'

const ROOT = join(import.meta.dirname, '..')
const CHECK_ONLY = process.argv.includes('--check') || process.argv.includes('packages:check')
// When invoked via `bun run packages:check`, argv may not include --check; detect script name.
const isCheckScript = process.env.npm_lifecycle_event === 'packages:check'

const WAVE_PACKAGES = [
  '@osm-editor-kit/osm-coverage',
  '@osm-editor-kit/osm-data',
  '@osm-editor-kit/osm-map-url',
  '@osm-editor-kit/osm-maplibre',
  '@osm-editor-kit/osm-route-snapper',
  '@osm-editor-kit/osm-way-chain',
  '@osm-editor-kit/street-imagery',
  '@osm-editor-kit/street-imagery-react',
] as const

type WavePackage = (typeof WAVE_PACKAGES)[number]

const DIR_BY_NAME: Record<WavePackage, string> = {
  '@osm-editor-kit/osm-coverage': 'packages/osm-coverage',
  '@osm-editor-kit/osm-data': 'packages/osm-data',
  '@osm-editor-kit/osm-map-url': 'packages/osm-map-url',
  '@osm-editor-kit/osm-maplibre': 'packages/osm-maplibre',
  '@osm-editor-kit/osm-route-snapper': 'packages/osm-route-snapper',
  '@osm-editor-kit/osm-way-chain': 'packages/osm-way-chain',
  '@osm-editor-kit/street-imagery': 'packages/street-imagery',
  '@osm-editor-kit/street-imagery-react': 'packages/street-imagery-react',
}

type Issue = { message: string; fix: string }

type PackageReport = {
  name: WavePackage
  version: string
  ready: boolean
  issues: Issue[]
}

type PkgJson = {
  name?: string
  version?: string
  private?: boolean
  publishConfig?: { access?: string; tag?: string }
  publishExports?: unknown
  scripts?: { build?: string; prepublishOnly?: string }
}

function parseArgs(argv: string[]) {
  const flags = { yes: false, dryRun: false, check: CHECK_ONLY || isCheckScript }
  for (const arg of argv) {
    if (arg === '--yes' || arg === '-y') flags.yes = true
    else if (arg === '--dry-run') flags.dryRun = true
    else if (arg === '--check') flags.check = true
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: bun run packages:release [--check] [--dry-run] [--yes]
       bun run packages:check`)
      process.exit(0)
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return flags
}

function run(cmd: string, args: string[], opts?: { cwd?: string; inherit?: boolean }) {
  const result = spawnSync(cmd, args, {
    cwd: opts?.cwd ?? ROOT,
    encoding: 'utf8',
    stdio: opts?.inherit === false ? 'pipe' : 'inherit',
  })
  if (result.status !== 0) {
    const detail = opts?.inherit === false ? result.stderr || result.stdout : ''
    throw new Error(`Command failed (${cmd} ${args.join(' ')})${detail ? `\n${detail}` : ''}`)
  }
  return result
}

function runCapture(cmd: string, args: string[], cwd = ROOT) {
  return spawnSync(cmd, args, { cwd, encoding: 'utf8' })
}

function readPkg(name: WavePackage): PkgJson {
  return JSON.parse(readFileSync(join(ROOT, DIR_BY_NAME[name], 'package.json'), 'utf8')) as PkgJson
}

function pendingChangesetFiles() {
  const prePath = join(ROOT, '.changeset', 'pre.json')
  const applied = new Set<string>()
  if (existsSync(prePath)) {
    const pre = JSON.parse(readFileSync(prePath, 'utf8')) as { changesets?: string[] }
    for (const id of pre.changesets ?? []) applied.add(id)
  }
  return readdirSync(join(ROOT, '.changeset')).filter((name) => {
    if (!name.endsWith('.md') || name === 'README.md') return false
    const id = name.replace(/\.md$/, '')
    return !applied.has(id)
  })
}

function packagesMentionedInPendingChangesets(): Set<string> {
  const mentioned = new Set<string>()
  for (const file of pendingChangesetFiles()) {
    const body = readFileSync(join(ROOT, '.changeset', file), 'utf8')
    for (const name of WAVE_PACKAGES) {
      if (body.includes(`"${name}"`)) mentioned.add(name)
    }
  }
  return mentioned
}

function npmVersionExists(name: string, version: string): boolean | 'unknown' {
  const result = runCapture('npm', ['view', `${name}@${version}`, 'version'])
  if (result.status === 0 && result.stdout.trim() === version) return true
  const err = `${result.stderr || ''}${result.stdout || ''}`
  if (err.includes('E404') || err.includes('404')) return false
  if (err.includes('E401') || err.includes('401')) return 'unknown'
  return 'unknown'
}

function preModeActive() {
  return existsSync(join(ROOT, '.changeset', 'pre.json'))
}

function checkGlobal(): Issue[] {
  const issues: Issue[] = []
  if (!preModeActive()) {
    issues.push({
      message: 'Changesets is not in alpha prerelease mode',
      fix: 'bunx changeset pre enter alpha',
    })
  }
  const whoami = runCapture('npm', ['whoami'])
  if (whoami.status !== 0) {
    issues.push({
      message: 'npm auth failed (npm whoami)',
      fix: 'npm login  # must publish under @osm-editor-kit',
    })
  }
  return issues
}

function checkPackage(
  name: WavePackage,
  pendingMention: Set<string>,
  opts: { canQueryNpm: boolean },
): PackageReport {
  const dir = DIR_BY_NAME[name]
  const pkg = readPkg(name)
  const version = pkg.version ?? '0.0.0'
  const issues: Issue[] = []

  if (pkg.private === true) {
    issues.push({
      message: 'package is private',
      fix: `Edit ${dir}/package.json — remove "private": true (wave packages must be public)`,
    })
  }
  if (!version.includes('-alpha')) {
    issues.push({
      message: `version "${version}" is not an alpha prerelease`,
      fix: 'bunx changeset   # select this package, then: bun run version-packages',
    })
  }
  if (pkg.publishConfig?.tag !== 'alpha') {
    issues.push({
      message: 'publishConfig.tag is not "alpha"',
      fix: `Set publishConfig.tag to "alpha" in ${dir}/package.json`,
    })
  }
  if (pkg.publishConfig?.access !== 'public') {
    issues.push({
      message: 'publishConfig.access is not "public"',
      fix: `Set publishConfig.access to "public" in ${dir}/package.json`,
    })
  }
  if (!pkg.publishExports) {
    issues.push({
      message: 'missing publishExports (dist entrypoints for the tarball)',
      fix: `Add publishExports pointing at dist/ in ${dir}/package.json`,
    })
  }
  if (!existsSync(join(ROOT, dir, 'dist', 'index.js'))) {
    issues.push({
      message: 'missing dist/index.js',
      fix: `bun run --filter ${name} build   # or: bun run build:packages`,
    })
  }
  if (!existsSync(join(ROOT, dir, 'dist', 'index.d.ts'))) {
    issues.push({
      message: 'missing dist/index.d.ts',
      fix: `bun run --filter ${name} build   # or: bun run build:packages`,
    })
  }
  if (name === '@osm-editor-kit/osm-route-snapper') {
    const wasm = join(ROOT, dir, 'vendor/osm-to-route-snapper/osm_to_route_snapper_bg.wasm')
    if (!existsSync(wasm)) {
      issues.push({
        message: 'missing vendored WASM for route-snapper',
        fix: `Ensure ${dir}/vendor/osm-to-route-snapper/ is present and listed in "files"`,
      })
    }
  }
  if (pendingMention.has(name)) {
    issues.push({
      message: 'has a pending changeset that is not applied yet',
      fix: 'bun run version-packages   # then commit version + CHANGELOG',
    })
  }

  if (opts.canQueryNpm) {
    const onNpm = npmVersionExists(name, version)
    if (onNpm === true) {
      issues.push({
        message: `${name}@${version} is already on npm`,
        fix: 'bunx changeset   # bump this package, then: bun run version-packages && bun run build:packages',
      })
    }
  }

  return { name, version, ready: issues.length === 0, issues }
}

function printReport(globalIssues: Issue[], reports: PackageReport[]) {
  if (globalIssues.length > 0) {
    p.log.error('Global blockers')
    for (const issue of globalIssues) {
      console.log(`  ${pc.red('✗')} ${issue.message}`)
      console.log(`    ${pc.dim('→')} ${pc.cyan(issue.fix)}`)
    }
  }

  const ready = reports.filter((r) => r.ready)
  const blocked = reports.filter((r) => !r.ready)

  if (ready.length > 0) {
    p.log.success(`Ready to publish (${ready.length})`)
    for (const r of ready) {
      console.log(`  ${pc.green('✓')} ${r.name}@${r.version}`)
    }
  }

  if (blocked.length > 0) {
    p.log.warn(`Skipped — not ready (${blocked.length})`)
    for (const r of blocked) {
      console.log(`  ${pc.yellow('•')} ${r.name}@${r.version}`)
      for (const issue of r.issues) {
        console.log(`      ${pc.red('✗')} ${issue.message}`)
        console.log(`        ${pc.dim('→')} ${pc.cyan(issue.fix)}`)
      }
    }
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  p.intro(pc.bgCyan(pc.black(flags.check ? ' packages:check ' : ' packages:release ')))

  const globalIssues = checkGlobal()
  const canQueryNpm = !globalIssues.some((i) => i.fix.startsWith('npm login'))
  const pendingMention = packagesMentionedInPendingChangesets()
  const s = p.spinner()
  s.start(canQueryNpm ? 'Checking wave packages against npm…' : 'Checking wave packages…')
  const reports = WAVE_PACKAGES.map((name) => checkPackage(name, pendingMention, { canQueryNpm }))
  s.stop('Checks done')

  printReport(globalIssues, reports)

  const ready = reports.filter((r) => r.ready)
  if (flags.check) {
    if (globalIssues.length > 0 || ready.length !== WAVE_PACKAGES.length) {
      p.outro(pc.yellow('Some packages are not ready — fix with the → commands above.'))
      process.exit(1)
    }
    p.outro(pc.green('All wave packages look ready to publish.'))
    return
  }

  if (globalIssues.length > 0) {
    p.outro(pc.red('Fix global blockers before publishing.'))
    process.exit(1)
  }

  if (ready.length === 0) {
    p.log.info('Prepare flow (when something is missing):')
    console.log(
      `  ${pc.cyan('1.')} bunx changeset              ${pc.dim('# pick packages that changed')}`,
    )
    console.log(
      `  ${pc.cyan('2.')} bun run version-packages    ${pc.dim('# apply bumps + CHANGELOGs')}`,
    )
    console.log(`  ${pc.cyan('3.')} bun run build:packages      ${pc.dim('# dist/ for the wave')}`)
    console.log(`  ${pc.cyan('4.')} bun run packages:check      ${pc.dim('# re-check')}`)
    console.log(
      `  ${pc.cyan('5.')} bun run packages:release    ${pc.dim('# publish ready packages')}`,
    )
    p.outro(pc.yellow('Nothing to publish.'))
    process.exit(1)
  }

  if (flags.dryRun) {
    p.outro(pc.dim(`Dry run — would publish ${ready.length} package(s) to dist-tag alpha.`))
    return
  }

  let proceed = flags.yes
  if (!proceed) {
    const answer = await p.confirm({
      message: `Publish ${ready.length} ready package(s) to npm dist-tag ${pc.cyan('alpha')}?`,
      initialValue: false,
    })
    if (p.isCancel(answer)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    proceed = answer
  }
  if (!proceed) {
    p.outro('Publish cancelled.')
    return
  }

  const pub = p.spinner()
  for (const r of ready) {
    pub.start(`Publishing ${r.name}@${r.version}…`)
    try {
      run('npm', ['publish', '--access', 'public', '--tag', 'alpha'], {
        cwd: join(ROOT, DIR_BY_NAME[r.name]),
      })
      pub.stop(`${pc.green('Published')} ${r.name}@${r.version}`)
    } catch (error) {
      pub.stop(`${pc.red('Failed')} ${r.name}`)
      throw error
    }
  }

  p.note(ready.map((r) => `bun add ${r.name}@alpha`).join('\n'), 'Install in consumers')
  p.outro(pc.green('Done. Commit any local version bumps if you have not already.'))
}

main().catch((error) => {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
