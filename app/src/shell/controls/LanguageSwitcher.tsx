import * as m from '@app/paraglide/messages'
import { Label } from '../../components/catalyst/fieldset'
import { Radio, RadioField, RadioGroup } from '../../components/catalyst/radio'
import { uiLocales, type UiLocale } from '../../i18n/uiLocale'
import { setUiLocale, useUiLocale } from '../../i18n/useUiLocale'

const localeLabels: Record<UiLocale, () => string> = {
  de: m.shell_lang_de,
  en: m.shell_lang_en,
}

export function LanguageSwitcher() {
  const uiLocale = useUiLocale()

  return (
    <RadioGroup
      value={uiLocale}
      onChange={(value) => setUiLocale(value as UiLocale)}
      aria-label={m.shell_language_title()}
      className="!space-y-2"
    >
      {uiLocales.map((locale) => (
        <RadioField key={locale}>
          <Radio value={locale} color="dark/zinc" />
          <Label>{localeLabels[locale]()}</Label>
        </RadioField>
      ))}
    </RadioGroup>
  )
}
