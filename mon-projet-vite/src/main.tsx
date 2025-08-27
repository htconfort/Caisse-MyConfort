import './config/production'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consolidateOnce } from '@/migrations/consolidateOnce'
import { sessionService } from '@/services'

// One-shot consolidation at boot
void consolidateOnce()
// Ensure a session exists at boot
void sessionService.ensureSession('system')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
