import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { analyze } from '../../src/core/analyze'
import { translateSentence } from '../../src/core/translate'
import App from '../../src/renderer/src/App'
import '../../src/renderer/src/styles.css'
import type { AnalyzeRequest, TranslateRequest } from '@shared/types'

window.lingua = {
  translate: (request: TranslateRequest) => translateSentence(request),
  analyze: (request: AnalyzeRequest) => analyze(request)
}

const container = document.getElementById('root')
if (!container) throw new Error('No #root container')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
