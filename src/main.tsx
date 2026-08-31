import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { RelayProvider } from './store'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RelayProvider>
      <App />
    </RelayProvider>
  </React.StrictMode>,
)
