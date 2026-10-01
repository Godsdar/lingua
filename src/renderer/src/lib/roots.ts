import type { LangCode } from '@shared/types'

export interface SavedRoot {
  id: string
  word: string
  from: LangCode
  to: LangCode
  gloss?: string
  ancestorWord?: string
  ancestorLang?: string
  createdAt: number
}

const KEY = 'lingua.roots.v1'
const MAX = 500

export function loadRoots (): SavedRoot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedRoot[]) : []
  } catch {
    return []
  }
}

export function persistRoots (roots: SavedRoot[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(roots.slice(0, MAX)))
  } catch {
    /* storage full or unavailable */
  }
}

export function makeRootId (
  word: string,
  from: LangCode,
  to: LangCode,
  ancestorWord?: string
): string {
  return [from, word.toLowerCase(), to, (ancestorWord ?? '').toLowerCase()].join('|')
}
