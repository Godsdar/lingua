import { translate } from '../core/providers'
import type { TranslateRequest } from '@shared/types'

const MAX_CACHE = 500
const cache = new Map<string, string>()

function remember (key: string, value: string): void {
  cache.set(key, value)
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

export async function translateSentence ({ text, from, to }: TranslateRequest): Promise<string> {
  if (!text.trim()) return ''
  const key = `${from}|${to}|${text}`

  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const { text: result } = await translate(text, from, to)
  remember(key, result)
  return result
}
