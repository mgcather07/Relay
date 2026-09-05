import React from 'react'
import { useSession } from './session'
import { RelayProvider } from './store'
import App from './App'
import Landing from './marketing/Landing'
import Onboarding from './marketing/Onboarding'

/* Chooses which of the four app states to render. */
export default function AppRoot() {
  const session = useSession()

  if (session.status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--app-bg)', display: 'grid', placeItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-2)', fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', animation: 'relay-pulse 1.2s infinite' }} />
          Loading your workspace…
        </div>
      </div>
    )
  }

  if (session.status === 'landing') return <Landing />
  if (session.status === 'onboarding') return <Onboarding />

  if (session.status === 'demo') {
    return (
      <RelayProvider mode="demo">
        <DemoBanner />
        <App />
      </RelayProvider>
    )
  }

  return (
    <RelayProvider key={session.orgId!} mode="live">
      <App />
    </RelayProvider>
  )
}

function DemoBanner() {
  const session = useSession()
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
        padding: '7px 16px', background: 'rgba(10,132,255,.12)', borderBottom: '1px solid rgba(10,132,255,.3)',
        fontSize: 12.5, color: 'var(--ink-1)',
      }}
    >
      <span>
        <b>Interactive demo</b> — sample company, sample people. Nothing saves; refresh to reset.
      </span>
      <span onClick={session.exitDemo} style={{ color: 'var(--blue-bright)', fontWeight: 700, cursor: 'pointer' }}>
        ← Back to site
      </span>
    </div>
  )
}
