import type { LinguaApi } from '../shared/types'

declare global {
  interface Window {
    lingua: LinguaApi
  }
}

export {}
