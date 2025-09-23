import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { processImportFromHash } from './services/directImport'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Cache-buster: 20250828_172726

// Import direct via hash (#import=base64)
processImportFromHash().catch(() => {})
