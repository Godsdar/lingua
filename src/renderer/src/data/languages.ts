import type { LangCode } from '@shared/types'

export interface LanguageOption {
  code: LangCode
  name: string
}

export const LANGS: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' }
]
