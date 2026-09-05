import React, { useState } from 'react'
import { Button } from '../ds'
import { useSession } from '../session'

/* ─────────────────────────────────────────────────────────────────────────
   First-run screen after signing up: create a company workspace (you become
   the admin) or join an existing one with an invite code from your admin.
   ───────────────────────────────────────────────────────────────────────── */

const field: React.CSSProperties = {
  width: '100%', height: 46, padding: '0 14px', background: 'var(--surface-inset)',
  border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)', color: 'var(--ink-1)', fontSize: 14.5,
}

export default function Onboarding() {
  const session = useSession()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [company, setCompany] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = async () => {
    setError('')
    setBusy(true)
    try {
      if (tab === 'create') await session.createOrg(company)
      else await session.joinOrg(code)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong — try again.')
      setBusy(false)
    }
  }

  const name = session.user?.displayName || session.user?.email || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 480, maxWidth: '96vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center', marginBottom: 26 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--sector-navy)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 4px rgba(10,132,255,.18)' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>
        </div>

        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-xl)', padding: 26 }}>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Welcome{name ? ', ' + name.split(' ')[0] : ''} 👋</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.55 }}>
            One last step — every Relay account belongs to a company workspace.
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface-inset)', border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {(
              [
                ['create', 'Create a workspace'],
                ['join', 'I have an invite code'],
              ] as const
            ).map(([k, label]) => (
              <div
                key={k}
                onClick={() => { setTab(k); setError('') }}
                style={{
                  flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: tab === k ? 'var(--surface-3)' : 'transparent',
                  border: tab === k ? '1px solid var(--hairline)' : '1px solid transparent',
                  color: tab === k ? 'var(--ink-1)' : 'var(--ink-2)',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (!busy) go() }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {tab === 'create' ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase', marginBottom: 7 }}>
                  Company name
                </div>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Northgate Industrial" style={field} autoFocus />
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55 }}>
                  You’ll be the administrator. Relay creates two invite codes — one for agents, one for
                  everyone else — plus a few sample tickets so the desk isn’t empty.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase', marginBottom: 7 }}>
                  Invite code
                </div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="AGT-XXXXXXXX or REQ-XXXXXXXX"
                  style={{ ...field, fontVariantNumeric: 'tabular-nums', letterSpacing: '.5px' }}
                  autoFocus
                />
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55 }}>
                  Your administrator finds this under Settings → Team &amp; invites. AGT codes join the
                  service desk; REQ codes open the request portal.
                </div>
              </div>
            )}

            {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>}

            <Button shape="pill" disabled={busy} type="submit">
              {busy ? 'Setting things up…' : tab === 'create' ? 'Create workspace' : 'Join workspace'}
            </Button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--ink-2)' }}>
          Signed in as {session.user?.email} ·{' '}
          <span onClick={() => session.signOutUser()} style={{ color: 'var(--blue)', cursor: 'pointer' }}>Sign out</span>
        </div>
      </div>
    </div>
  )
}
