export type LangCode = 'en' | 'ru' | 'es' | 'fr'

export interface TranslateRequest {
  text: string
  from: LangCode
  to: LangCode
}

export interface AnalyzeRequest {
  text: string
  from: LangCode
  to: LangCode
}

export interface EtymologyNode {
  lang: string
  langName: string
  word: string
  relation?: string
}

export interface WordAnalysis {
  token: string
  pos?: string
  gloss?: string
  alternatives: string[]
  etymology: EtymologyNode[]
  targetEtymology: EtymologyNode[]
  sharedAncestor?: EtymologyNode
}

export interface AnalyzeResult {
  tokens: WordAnalysis[]
}

export interface LinguaApi {
  translate: (request: TranslateRequest) => Promise<string>
  analyze: (request: AnalyzeRequest) => Promise<AnalyzeResult>
}

export const IPC = {
  translate: 'translate',
  analyze: 'analyze'
} as const
