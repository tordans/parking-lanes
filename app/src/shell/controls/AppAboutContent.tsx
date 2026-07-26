import { Badge } from '../../components/catalyst/badge'
import { APP_REPO_URL, buildModeFeedbackUrl } from '../../lib/app-identity'
import type { ModeAboutContent, ModeMaturity } from '../../modes/types'
import { PanelSectionDivider } from './PanelSectionDivider'

const MATURITY_LABELS: Record<ModeMaturity, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  experimental: 'Experimental',
}

const MATURITY_BADGE_COLORS: Record<ModeMaturity, 'amber' | 'blue' | 'purple'> = {
  alpha: 'amber',
  beta: 'blue',
  experimental: 'purple',
}

const MATURITY_FEEDBACK: Record<ModeMaturity, string> = {
  alpha: 'This mode is in alpha',
  beta: 'This mode is in beta',
  experimental: 'This mode is experimental',
}

type Props = {
  about: ModeAboutContent
  modeLabel: string
  maturity: ModeMaturity
}

export function AppAboutContent({ about, modeLabel, maturity }: Props) {
  const linkClass = 'text-blue-600 hover:underline'
  const feedbackUrl =
    typeof window !== 'undefined'
      ? buildModeFeedbackUrl({ mode: modeLabel, pageUrl: window.location.href })
      : buildModeFeedbackUrl({ mode: modeLabel, pageUrl: '' })

  return (
    <div className="flex flex-col text-sm">
      <section className="pb-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900">About</h3>
          <Badge color={MATURITY_BADGE_COLORS[maturity]} className="uppercase tracking-wide">
            {MATURITY_LABELS[maturity]}
          </Badge>
        </div>
        <p className="text-zinc-700">{about.description}</p>
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
          <p>
            {MATURITY_FEEDBACK[maturity]}. Feedback is welcome in{' '}
            <a href={feedbackUrl} target="_blank" rel="noreferrer" className={linkClass}>
              GitHub issues
            </a>{' '}
            for {modeLabel} mode.
          </p>
        </div>
      </section>

      <PanelSectionDivider />

      <section className="flex flex-col gap-2 py-4">
        <h3 className="font-semibold text-zinc-900">Links</h3>
        <div className="flex flex-col gap-1.5">
          <a href={about.taggingGuide.href} target="_blank" rel="noreferrer" className={linkClass}>
            {about.taggingGuide.label}
          </a>
          <a href={feedbackUrl} target="_blank" rel="noreferrer" className={linkClass}>
            Report feedback ({modeLabel} mode)
          </a>
          <a href={APP_REPO_URL} target="_blank" rel="noreferrer" className={linkClass}>
            GitHub
          </a>
        </div>
      </section>
    </div>
  )
}
