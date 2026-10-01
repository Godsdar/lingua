import { translate } from './providers'
import type { LangCode } from '@shared/types'

export interface WordGloss {
  gloss?: string
  pos?: string
  alternatives: string[]
}

const MAX_CACHE = 1000
const cache = new Map<string, Promise<WordGloss>>()

function remember (key: string, value: Promise<WordGloss>): void {
  cache.set(key, value)
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

export function translateWord (word: string, from: LangCode, to: LangCode): Promise<WordGloss> {
  const key = `${from}|${to}|${word.toLowerCase()}`
  let pending = cache.get(key)
  if (!pending) {
    pending = (async (): Promise<WordGloss> => {
      try {
        const { text } = await translate(word, from, to)
        return { gloss: text || undefined, alternatives: [] }
      } catch {
        return { alternatives: [] }
      }
    })()
    remember(key, pending)
  }
  return pending
}
