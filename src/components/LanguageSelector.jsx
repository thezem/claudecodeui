/**
 * Language Selector Component
 *
 * A dropdown component for selecting the application language.
 * Automatically updates the i18n language and persists to localStorage.
 *
 * Props:
 * @param {boolean} compact - If true, uses compact style (default: false)
 */

import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { languages } from '../i18n/languages'

function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation('settings')

  const handleLanguageChange = event => {
    const newLanguage = event.target.value
    i18n.changeLanguage(newLanguage)
  }

  // Compact style for QuickSettingsPanel
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-card dark:bg-card/50 hover:bg-card/80 dark:hover:bg-card/70 transition-colors border border-transparent hover:border-border dark:hover:border-border">
        <span className="flex items-center gap-2 text-sm text-foreground">
          <Languages className="h-4 w-4 text-muted-foreground" />
          {t('account.language')}
        </span>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="w-[100px] text-sm bg-background dark:bg-card border border-input dark:border-border text-foreground rounded-lg focus:ring-1 focus:ring-ring focus:border-ring p-2 focus:outline-none"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Full style for Settings page
  return (
    <div className="bg-card dark:bg-card/50 border border-border dark:border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-foreground mb-1">{t('account.languageLabel')}</div>
          <div className="text-sm text-muted-foreground">{t('account.languageDescription')}</div>
        </div>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="text-sm bg-background dark:bg-card border border-input dark:border-border text-foreground rounded-lg focus:ring-1 focus:ring-ring focus:border-ring p-2 w-36"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default LanguageSelector
