import { findSharedAncestor, getLexicons } from './wiktionary'
import type { Lexicon } from './wiktionary'
import { translateWord } from './wordTranslate'
import type { AnalyzeRequest, AnalyzeResult, EtymologyNode, LangCode, WordAnalysis } from '@shared/types'

const MAX_WORDS = 8
const EMPTY: EtymologyNode[] = []

async function mapLimit<T, R> (items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

function tokenize (text: string): string[] {
  return text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? []
}

function uniqueWords (text: string): string[] {
  const seen = new Set<string>()
  const words: string[] = []
  for (const word of tokenize(text)) {
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    words.push(word)
  }
  return words
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'for', 'on', 'with', 'at', 'by', 'from', 'is', 'are', 'was', 'be',
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'y', 'o', 'para', 'por', 'con', 'en', 'es', 'son',
  'le', 'les', 'des', 'du', 'au', 'et', 'ou', 'pour', 'par', 'avec', 'est', 'sont', 'une',
  'и', 'в', 'во', 'не', 'на', 'с', 'со', 'а', 'то', 'к', 'у', 'по', 'из', 'от', 'за', 'же', 'ли', 'или', 'да', 'но', 'о', 'об'
])

function targetGloss (gloss: string): string {
  const words = gloss.replace(/[^\p{L}\p{M}'’-]+/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.find(word => !STOPWORDS.has(word.toLowerCase())) ?? words[0]
}

async function safeLexicons (words: string[], lang: LangCode, target?: LangCode): Promise<Map<string, Lexicon>> {
  try {
    return await getLexicons(words, lang, target)
  } catch {
    return new Map()
  }
}

export async function analyze ({ text, from, to }: AnalyzeRequest): Promise<AnalyzeResult> {
  const words = uniqueWords(text).slice(0, MAX_WORDS)
  if (words.length === 0) return { tokens: [] }

  const [sourceMap, providerGlosses] = await Promise.all([
    safeLexicons(words, from, to),
    mapLimit(words, 4, word => translateWord(word, from, to))
  ])

  const glossFor = (word: string, index: number): string | undefined => {
    const wiktionary = sourceMap.get(word)?.translations ?? []
    return wiktionary[0] ?? providerGlosses[index].gloss
  }

  const targetSet = new Map<string, string>()
  words.forEach((word, index) => {
    const gloss = glossFor(word, index)
    const source = sourceMap.get(word)
    if (!gloss || !source || source.etymology.length <= 1) return
    const targetWord = targetGloss(gloss)
    if (targetWord && targetWord.toLowerCase() !== word.toLowerCase()) {
      targetSet.set(targetWord.toLowerCase(), targetWord)
    }
  })

  const targetMap = await safeLexicons(Array.from(targetSet.values()), to)

  const tokens: WordAnalysis[] = words.map((word, index) => {
    const source = sourceMap.get(word)
    const translations = source?.translations ?? []
    const gloss = translations[0] ?? providerGlosses[index].gloss
    const targetWord = gloss ? targetGloss(gloss) : ''
    const target = targetWord ? targetMap.get(targetWord) : undefined

    const etymology = source?.etymology ?? EMPTY
    const targetEtymology = target?.etymology ?? EMPTY
    const sharedAncestor = etymology.length > 0 && targetEtymology.length > 0
      ? findSharedAncestor(etymology, targetEtymology)
      : undefined

    return {
      token: word,
      pos: source?.pos ?? providerGlosses[index].pos,
      gloss,
      alternatives: translations.length > 1 ? translations.slice(1, 6) : providerGlosses[index].alternatives,
      etymology,
      targetEtymology,
      sharedAncestor
    }
  })

  return { tokens }
}
