import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Popup from './Popup'

const container = document.getElementById('root')
if (!container) throw new Error('No #root container')

createRoot(container).render(
  <StrictMode>
    <Popup />
  </StrictMode>
)
