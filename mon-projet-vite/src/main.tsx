import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { processImportFromHash, startDirectWebhookPolling } from './services/directImport'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Cache-buster: 20250828_172726

// Import direct via hash (#import=base64)
processImportFromHash().catch(() => {})

// Démarrage d'un polling léger pour consommer les factures poussées par webhook
startDirectWebhookPolling(5000)
