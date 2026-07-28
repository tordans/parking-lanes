import * as m from '@app/paraglide/messages'
import { Badge } from '../../components/catalyst/badge'
import { getModeAboutDescription } from '../../i18n/mode-content'
import {
  APP_BUILD_DATE,
  APP_CHANGELOG_URL,
  APP_NAME,
  APP_REPO_URL,
  APP_VERSION,
  buildModeFeedbackUrl,
} from '../../lib/app-identity'
import type { ModeAboutContent, ModeMaturity, StreetSpaceModeId } from '../../modes/types'
import { assetUrl } from '../../utils/asset-url'
import { PanelSectionDivider } from './PanelSectionDivider'

const APP_LOGO_SRC = assetUrl('osm-street-space-editor-logo-2026.svg')

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
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-zinc-900">{m.shell_about_title()}</h3>
              <Badge color={MATURITY_BADGE_COLORS[maturity]} className="uppercase tracking-wide">
                {MATURITY_LABELS[maturity]()}
              </Badge>
            </div>
            <p className="text-zinc-700">{getModeAboutDescription(modeId)}</p>
          </div>
          <img
            src={APP_LOGO_SRC}
            alt={APP_NAME}
            width={96}
            height={91}
            className="size-20 shrink-0 object-contain drop-shadow-sm sm:size-24"
          />
        </div>
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
          <p>
            {MATURITY_FEEDBACK[maturity]()}. {m.shell_feedback_welcome_before()}{' '}
            <a href={feedbackUrl} target="_blank" rel="noreferrer" className={linkClass}>
              {m.shell_github_issues()}
            </a>{' '}
            {m.shell_feedback_welcome_after({ modeLabel })}
          </p>
        </div>
        {modeId === 'parking' ? (
          <p className="mt-3 text-zinc-600">
            {m.mode_parking_thanks_before()}{' '}
            <a
              href="https://github.com/zlant/parking-lanes"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              {m.mode_parking_thanks_link()}
            </a>{' '}
            {m.mode_parking_thanks_after()}
          </p>
        ) : null}
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

export function AppVersionFooter() {
  const linkClass = 'text-blue-600 hover:underline'

  return (
    <section className="flex flex-col gap-1.5 py-4 text-zinc-500">
      <p>
        {APP_NAME} {APP_VERSION} · {APP_BUILD_DATE}
      </p>
      <a href={APP_CHANGELOG_URL} target="_blank" rel="noreferrer" className={linkClass}>
        {m.shell_changelog()}
      </a>
    </section>
  )
}
