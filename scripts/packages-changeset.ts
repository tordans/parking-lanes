#!/usr/bin/env bun
/**
 * Non-interactive changeset writer for first-wave packages.
 *
 * Usage:
 *   bun run packages:changeset
 *   bun run packages:changeset -- --check
 *   bun run packages:changeset -- --auto
 *   bun run packages:changeset -- --force
 *
 * Exit codes (--auto):
 *   0 — already covered / nothing to do
 *   1 — failure
 *   2 — changeset committed; run git push again
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import {
  ROOT,
  type WavePackage,
  commitsTouchingPackage,
  defaultGitRange,
  DIR_BY_NAME,
  packagesMentionedInPendingChangesets,
  shortPackageName,
  uncoveredWavePackages,
  wavePackagesTouchedInDiff,
} from './packages-wave.ts'

const EXIT_OK = 0
const EXIT_FAIL = 1
const EXIT_REPUSH = 2

const ADJECTIVES = [
  'brave',
  'calm',
  'clever',
  'bright',
  'gentle',
  'lucky',
  'quick',
  'silly',
  'tidy',
  'witty',
  'amber',
  'coral',
  'fair',
  'keen',
  'noble',
  'proud',
  'solid',
  'swift',
  'vivid',
  'zesty',
]
const NOUNS = [
  'boats',
  'clouds',
  'foxes',
  'geese',
  'lakes',
  'maps',
  'owls',
  'pines',
  'rivers',
  'stones',
  'trails',
  'waves',
  'winds',
  'yards',
  'zebras',
  'anchors',
  'bridges',
  'canyons',
  'dunes',
  'fjords',
]

function parseArgs(argv: string[]) {
  const flags = { check: false, auto: false, force: false }
  for (const arg of argv) {
    if (arg === '--') continue
    if (arg === '--check') flags.check = true
    else if (arg === '--auto') flags.auto = true
    else if (arg === '--force') flags.force = true
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: bun run packages:changeset [--check|--auto|--force]`)
      process.exit(0)
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return flags
}

function randomChangesetId(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!
  const b = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!
  const c = NOUNS[Math.floor(Math.random() * NOUNS.length)]!
  return `${a}-${b}-${c}`
}

function formatCommitBullets(notes: { subject: string; body: string }[]): string {
  if (notes.length === 0) return '- (no commits in range for this package)'
  const lines: string[] = []
  for (const note of notes) {
    lines.push(`- ${note.subject}`)
    if (note.body) {
      for (const bodyLine of note.body.split('\n')) {
        const t = bodyLine.trim()
        if (!t) continue
        lines.push(`  ${t.startsWith('-') ? t : `- ${t}`}`)
      }
    }
  }
  return lines.join('\n')
}

function buildChangesetMarkdown(packages: WavePackage[], range: string): string {
  const frontmatter = [
    '---',
    ...packages.map((name) => `"${name}": patch`),
    '---',
    '',
  ].join('\n')

  const sections = packages.map((name) => {
    const dir = DIR_BY_NAME[name]
    const notes = commitsTouchingPackage(dir, range)
    return `### ${name}\n\n${formatCommitBullets(notes)}`
  })

  return `${frontmatter}${sections.join('\n\n')}\n`
}

function writeScaffold(packages: WavePackage[], range: string): string {
  mkdirSync(join(ROOT, '.changeset'), { recursive: true })
  let id = randomChangesetId()
  let path = join(ROOT, '.changeset', `${id}.md`)
  while (existsSync(path)) {
    id = randomChangesetId()
    path = join(ROOT, '.changeset', `${id}.md`)
  }
  writeFileSync(path, buildChangesetMarkdown(packages, range))
  return path
}

function resolveCursorAgentBinary(): string | null {
  for (const name of ['cursor-agent', 'agent']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' })
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim()
  }
  return null
}

function buildAgentPrompt(changesetPath: string, packages: WavePackage[], range: string): string {
  const templatePath = join(ROOT, 'scripts/packages-changeset-agent-prompt.md')
  let template = readFileSync(templatePath, 'utf8')
  const relativePath = changesetPath.startsWith(ROOT)
    ? changesetPath.slice(ROOT.length + 1)
    : changesetPath

  const evidence = packages
    .map((name) => {
      const dir = DIR_BY_NAME[name]
      const notes = commitsTouchingPackage(dir, range)
      const diff = spawnSync('git', ['diff', range, '--', dir], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 2 * 1024 * 1024,
      })
      const diffText = (diff.stdout || '').slice(0, 12_000)
      return [
        `### ${name}`,
        '',
        'Commits:',
        formatCommitBullets(notes),
        '',
        'Diff (truncated):',
        '```diff',
        diffText || '(empty)',
        '```',
      ].join('\n')
    })
    .join('\n\n')

  template = template.replaceAll('{{CHANGESET_PATH}}', relativePath)
  template = template.replaceAll('{{PACKAGE_EVIDENCE}}', evidence)
  return template
}

function runCursorAgent(prompt: string): { status: number; stdout: string; stderr: string } {
  const bin = resolveCursorAgentBinary()
  if (!bin) {
    return {
      status: 1,
      stdout: '',
      stderr:
        'cursor-agent (or agent) not found on PATH. Install Cursor CLI / log in, then retry.',
    }
  }
  const model = process.env.OSM_CHANGESET_AGENT_MODEL?.trim() || 'composer-2.5'
  const args = [
    '-p',
    '--trust',
    '--force',
    '--output-format',
    'json',
    '--model',
    model,
    '--workspace',
    ROOT,
    prompt,
  ]
  const result = spawnSync(bin, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function commitChangesetFile(changesetPath: string, packages: WavePackage[]): void {
  const rel = changesetPath.startsWith(ROOT) ? changesetPath.slice(ROOT.length + 1) : changesetPath
  const short = packages.map(shortPackageName).join(', ')
  const message = `Chore: add changeset for ${short}`

  // Skip husky so pre-push does not recurse while we are already in a hook.
  const env = { ...process.env, HUSKY: '0' }
  const add = spawnSync('git', ['add', '--', rel], { cwd: ROOT, encoding: 'utf8', env })
  if (add.status !== 0) {
    throw new Error(`git add failed:\n${add.stderr || add.stdout}`)
  }
  const commit = spawnSync('git', ['commit', '-m', message], {
    cwd: ROOT,
    encoding: 'utf8',
    env,
  })
  if (commit.status !== 0) {
    throw new Error(`git commit failed:\n${commit.stderr || commit.stdout}`)
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  if (flags.check && flags.auto) {
    throw new Error('Use either --check or --auto, not both')
  }

  if (process.env.SKIP_PACKAGE_CHANGESET_AUTO === '1' && flags.auto) {
    p.log.warn('SKIP_PACKAGE_CHANGESET_AUTO=1 — skipping packages:changeset --auto')
    process.exit(EXIT_OK)
  }

  p.intro(pc.bgCyan(pc.black(' packages:changeset ')))

  const range = defaultGitRange()
  const touched = wavePackagesTouchedInDiff(range)
  const uncovered = uncoveredWavePackages(range)

  if (touched.length === 0) {
    p.outro(pc.dim(`No wave packages changed in ${range}.`))
    process.exit(EXIT_OK)
  }

  if (uncovered.length === 0 && !flags.force) {
    const covered = [...packagesMentionedInPendingChangesets()]
      .map(shortPackageName)
      .join(', ')
    p.outro(pc.green(`All touched wave packages already have a pending changeset (${covered}).`))
    process.exit(EXIT_OK)
  }

  const packagesToWrite = flags.force ? touched : uncovered

  if (flags.check) {
    p.log.error(`Wave packages changed without a changeset (${range}):`)
    for (const name of uncovered) {
      console.log(`  ${pc.red('✗')} ${name}`)
    }
    console.log(`  ${pc.dim('→')} ${pc.cyan('bun run packages:changeset -- --auto')}`)
    console.log(
      `  ${pc.dim('→')} or scaffold only: ${pc.cyan('bun run packages:changeset')} then edit .changeset/*.md`,
    )
    p.outro(pc.yellow('Push blocked until a pending changeset covers these packages.'))
    process.exit(EXIT_FAIL)
  }

  const path = writeScaffold(packagesToWrite, range)
  const rel = path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path
  p.log.success(`Wrote ${rel}`)

  if (!flags.auto) {
    p.log.info('Edit the body into user-facing notes per package, then commit the file.')
    console.log(`  ${pc.dim('→')} ${pc.cyan(`bun run packages:changeset -- --auto`)}  to rewrite via cursor-agent`)
    p.outro(pc.green('Scaffold ready.'))
    process.exit(EXIT_OK)
  }

  const s = p.spinner()
  s.start('Running cursor-agent to rewrite user-facing changeset notes…')
  const prompt = buildAgentPrompt(path, packagesToWrite, range)
  const agent = runCursorAgent(prompt)
  if (agent.status !== 0) {
    s.stop('cursor-agent failed')
    p.log.error(agent.stderr || agent.stdout || 'cursor-agent exited non-zero')
    p.log.info(`Scaffold left at ${rel} — edit manually, commit, then push again.`)
    console.log(`  ${pc.dim('→')} Install/login: ${pc.cyan('cursor-agent login')}`)
    p.outro(pc.red('Auto changeset rewrite failed.'))
    process.exit(EXIT_FAIL)
  }
  s.stop('cursor-agent finished')

  const stillUncovered = uncoveredWavePackages(range)
  if (stillUncovered.length > 0 && !flags.force) {
    // Force path writes all touched; after agent, pending should mention them.
    // If agent deleted frontmatter packages, fail loudly.
    const missing = stillUncovered.filter((name) => packagesToWrite.includes(name))
    if (missing.length > 0) {
      p.log.error('After agent rewrite, some packages are still uncovered:')
      for (const name of missing) console.log(`  ${pc.red('✗')} ${name}`)
      p.outro(pc.red('Fix the changeset frontmatter and retry.'))
      process.exit(EXIT_FAIL)
    }
  }

  try {
    commitChangesetFile(path, packagesToWrite)
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : String(error))
    p.outro(pc.red('Failed to commit changeset.'))
    process.exit(EXIT_FAIL)
  }

  p.log.success('Committed changeset')
  p.outro(pc.yellow('Run git push again to include the changeset commit.'))
  process.exit(EXIT_REPUSH)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(EXIT_FAIL)
})
