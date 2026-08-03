import type { ReactNode } from 'react'
import type { TranslationKey } from '@/i18n/messages'
import { createContext, use, useEffect, useMemo, useState } from 'react'

import { zhCN } from '@/i18n/messages'

export type AppLanguage = 'en' | 'zh-CN'

const LANGUAGE_STORAGE_KEY = 'tool-box-language'

interface I18nContextValue {
  language: AppLanguage
  locale: string
  setLanguage: (language: AppLanguage) => void
  toggleLanguage: () => void
  t: (message: TranslationKey, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'zh-CN')
    return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values)
    return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const applyLanguage = (nextLanguage: AppLanguage) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
      setLanguage(nextLanguage)
    }

    return {
      language,
      locale: language === 'zh-CN' ? 'zh-CN' : 'en-US',
      setLanguage: applyLanguage,
      toggleLanguage: () => applyLanguage(language === 'en' ? 'zh-CN' : 'en'),
      t: (message, values) => interpolate(language === 'zh-CN' ? (zhCN[message] ?? message) : message, values),
    }
  }, [language])

  return <I18nContext value={value}>{children}</I18nContext>
}

export function useI18n() {
  const context = use(I18nContext)
  if (!context)
    throw new Error('useI18n must be used within I18nProvider')
  return context
}
