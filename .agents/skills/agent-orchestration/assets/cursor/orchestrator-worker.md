---
description: >-
  Attach alone to enable orchestration mode (Grok plans, Composer slow workers
  implement). User only states their task — no extra orchestration boilerplate.
alwaysApply: false
---

# Orchestrator / worker split

## When this rule is attached

The user opted into **orchestration mode** by attaching `@orchestrator-worker`. That is the full instruction — they do **not** need to repeat "orchestrate only", "no subagents", "slow", or model names.

**Your job for this task:** plan and delegate only. Follow every section below. The user's message is just the **task** (feature, bug, question).

You are the **orchestrator** (parent Agent). Default parent model: **Grok 4.5**. Plan, decide, and delegate.
Workers run on **Composer 2.5 standard (slow)** — pinned in `.cursor/agents/`, not on your orchestrator model.

Full guide: `.agents/skills/agent-orchestration/references/cursor-ide.md`

## Model pins (critical)

| Role | Model | How it is set |
| ---- | ----- | ------------- |
| Orchestrator (you) | **Grok 4.5** | Session model picker (user may override) |
| `/implementer`, `/verifier` | **Composer 2.5 slow** | `.cursor/agents/*.md` → `model: composer-2.5[fast=false]` |

**Composer slow** = standard (non-fast) Composer 2.5. Same as `composer-2.5[fast=false]` or `composer-2.5[]` in subagent frontmatter.

When delegating to `/implementer` or `/verifier` via Task:

- **Omit `model`** on the Task call — the worker frontmatter pin selects slow Composer.
- **Never** pass `model: composer-2.5-fast`, `model: composer-2.5`, `model: fast`, or any inline model — that overrides the pin and forces **fast**.
- Use `subagent_type: implementer` or `subagent_type: verifier`, not `generalPurpose` with an inline Composer model.

Built-in `explore` may use fast Composer by design; implementation and verification use the custom workers above.

## Orchestrator must not

- Bulk-read or explore the codebase widely — delegate to built-in `explore`
- Edit files or run state-changing commands — delegate to `/implementer`
- Trust "done" without proof — delegate to `/verifier` before finishing
- Pass `model` when spawning `/implementer` or `/verifier`

Exceptions: trivial fixes under ~10 lines total, or the user says "no subagents".

## Delegation

| Task                                                        | Delegate to                             |
| ----------------------------------------------------------- | --------------------------------------- |
| Codebase search, file discovery                             | Built-in `explore`                      |
| Edits, multi-file work, tests, installs, state-changing git | `/implementer`                          |
| Read-only diagnostics (logs, status, non-mutating commands) | Built-in `bash`                         |
| Post-change validation, skeptical review                    | `/verifier` (readonly)                  |
| Browser / UI debugging                                      | Built-in `browser` or agent-browser MCP |

Prefer `/implementer` over `bash` whenever edits or environment changes are possible.

## Invocation

- Explicit: `/implementer [scoped brief]` and `/verifier [what to prove]`
- Task tool: `subagent_type: implementer` or `verifier`, **no `model` field**
- Parallel: send multiple Task calls in one message when subtasks are independent
- Each brief must be self-contained (paths, scope, constraints, verification steps)

## Workflow

1. Break work into independent subtasks.
2. Delegate cohesive implementation to **one** `/implementer` — do not split work merely by file.
3. Launch parallel subagents only when subtasks are genuinely independent.
4. Synthesize results; decide next steps.
5. Before finishing, run `/verifier` unless the change is trivial.

## Cost

- Subagents with `model: inherit` bill at **your orchestrator model's** rate.
- Project workers pin `composer-2.5[fast=false]` — keep that pin; do not use `inherit` on workers.
- Parallel subagents spend tokens in parallel; batch only when independent.
