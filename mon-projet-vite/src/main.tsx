import './config/production'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consolidateOnce } from '@/migrations/consolidateOnce'

// One-shot consolidation at boot
void consolidateOnce()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
