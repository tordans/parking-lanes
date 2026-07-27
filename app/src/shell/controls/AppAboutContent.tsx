import * as m from '@app/paraglide/messages'
import { Badge } from '../../components/catalyst/badge'
import { getModeAboutDescription } from '../../i18n/mode-content'
import { APP_REPO_URL, buildModeFeedbackUrl } from '../../lib/app-identity'
import type { ModeAboutContent, ModeMaturity, StreetSpaceModeId } from '../../modes/types'
import { PanelSectionDivider } from './PanelSectionDivider'

const MATURITY_LABELS = {
  alpha: m.shell_maturity_alpha,
  beta: m.shell_maturity_beta,
  experimental: m.shell_maturity_experimental,
} as const satisfies Record<ModeMaturity, () => string>

const MATURITY_BADGE_COLORS: Record<ModeMaturity, 'amber' | 'blue' | 'purple'> = {
  alpha: 'amber',
  beta: 'blue',
  experimental: 'purple',
}

const MATURITY_FEEDBACK = {
  alpha: m.shell_maturity_feedback_alpha,
  beta: m.shell_maturity_feedback_beta,
  experimental: m.shell_maturity_feedback_experimental,
} as const satisfies Record<ModeMaturity, () => string>

type Props = {
  modeId: StreetSpaceModeId
  about: ModeAboutContent
  modeLabel: string
  maturity: ModeMaturity
}

export function AppAboutContent({ modeId, about, modeLabel, maturity }: Props) {
  const linkClass = 'text-blue-600 hover:underline'
  const feedbackUrl =
    typeof window !== 'undefined'
      ? buildModeFeedbackUrl({ mode: modeLabel, pageUrl: window.location.href })
      : buildModeFeedbackUrl({ mode: modeLabel, pageUrl: '' })

  return (
    <div className="flex flex-col text-sm">
      <section className="pb-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900">{m.shell_about_title()}</h3>
          <Badge color={MATURITY_BADGE_COLORS[maturity]} className="uppercase tracking-wide">
            {MATURITY_LABELS[maturity]()}
          </Badge>
        </div>
        <p className="text-zinc-700">{getModeAboutDescription(modeId)}</p>
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
          <p>
            {MATURITY_FEEDBACK[maturity]()}. {m.shell_feedback_welcome_before()}{' '}
            <a href={feedbackUrl} target="_blank" rel="noreferrer" className={linkClass}>
              {m.shell_github_issues()}
            </a>{' '}
            {m.shell_feedback_welcome_after({ modeLabel })}
          </p>
        </div>
      </section>

      <PanelSectionDivider />

      <section className="flex flex-col gap-2 py-4">
        <h3 className="font-semibold text-zinc-900">{m.shell_links_title()}</h3>
        <div className="flex flex-col gap-1.5">
          <a href={about.taggingGuide.href} target="_blank" rel="noreferrer" className={linkClass}>
            {m.shell_tagging_guide()}
          </a>
          <a href={feedbackUrl} target="_blank" rel="noreferrer" className={linkClass}>
            {m.shell_report_feedback({ modeLabel })}
          </a>
          <a href={APP_REPO_URL} target="_blank" rel="noreferrer" className={linkClass}>
            {m.shell_github()}
          </a>
        </div>
      </section>
    </div>
  )
}
