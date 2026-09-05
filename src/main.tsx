import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { SessionProvider } from './session'
import AppRoot from './AppRoot'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider>
      <AppRoot />
    </SessionProvider>
  </React.StrictMode>,
)
