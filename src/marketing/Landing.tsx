import React, { useState } from 'react'
import { Badge, Button } from '../ds'
import { icons } from '../lib/icons'
import { useSession, friendlyAuthError } from '../session'

/* ─────────────────────────────────────────────────────────────────────────
   Public marketing site — what a visiting company sees before they buy.
   Sign in / create account happens here; the demo needs no account.
   ───────────────────────────────────────────────────────────────────────── */

type AuthMode = 'signin' | 'signup' | 'reset' | null

const FEATURES = [
  { icon: 'inbox', tint: 'var(--blue)', title: 'One queue, every channel', body: 'Phone calls, email, walk-ups and the self-service portal land in a single prioritized queue with live SLA countdowns on every row.' },
  { icon: 'clock', tint: 'var(--red)', title: 'SLA clocks that mean it', body: 'Every priority carries a resolution target. Relay counts down in real time, flags at-risk tickets an hour out, and shows breaches in red — no report to run.' },
  { icon: 'user', tint: 'var(--green)', title: 'Roles out of the box', body: 'Admins run the workspace, agents work the desk, requesters get a clean portal that shows only their own requests. One invite code per role.' },
  { icon: 'portal', tint: 'var(--cyan)', title: 'A portal people actually use', body: 'Employees describe the problem in plain words, pick how much it blocks them, and Relay sets priority and routing automatically.' },
  { icon: 'chart', tint: 'var(--orange)', title: 'Live queue health', body: 'Open volume, breaches, and per-agent load computed from your real tickets — the dashboard is the queue, not a nightly export.' },
  { icon: 'phone', tint: 'var(--yellow)', title: 'On-call built in', body: 'Weekly rotations with escalation ladders and holiday cover, generated from your team roster. New tickets can pre-assign to whoever is on call.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    per: 'while in early access',
    tint: 'var(--green)',
    features: ['Up to 3 agents', 'Unlimited requesters', 'Full ticketing + portal', 'SLA tracking', 'Community support'],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Team',
    price: '$12',
    per: 'per agent / month',
    tint: 'var(--blue)',
    features: ['Unlimited agents', 'Everything in Starter', 'Audit trail & scorecards', 'On-call rotations', 'Priority email support'],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: 'annual agreement',
    tint: 'var(--purple)',
    features: ['Everything in Team', 'Directory sync (LDAP / AD)', 'SQL archive connector', 'Dedicated onboarding', 'Custom retention & SLAs'],
    cta: 'Contact sales',
    popular: false,
  },
]

export default function Landing() {
  const session = useSession()
  const [authMode, setAuthMode] = useState<AuthMode>(null)

  const startSignup = () => setAuthMode('signup')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      {/* Nav */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 18,
          height: 60, padding: '0 max(20px, 4vw)',
          background: 'rgba(10,13,18,.78)', backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid var(--hairline-soft)',
        }}
      >
        <Logo />
        <div style={{ flex: 1 }} />
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#pricing">Pricing</NavLink>
        <NavLink href="/docs.html">Docs</NavLink>
        <div onClick={() => setAuthMode('signin')} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer' }}>
          Sign in
        </div>
        <Button size="sm" shape="pill" onClick={startSignup}>Get started</Button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '84px 20px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(10,132,255,.35)', background: 'rgba(10,132,255,.10)', marginBottom: 22 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'relay-pulse 2.4s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: 'var(--blue-bright)' }}>Help desk software for internal IT teams</span>
        </div>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.06, margin: 0 }}>
          The service desk your company
          <br />
          <span style={{ color: 'var(--blue-bright)' }}>actually keeps up with.</span>
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--ink-2)', lineHeight: 1.6, maxWidth: 620, margin: '20px auto 0', textWrap: 'pretty' }}>
          Relay turns calls, emails and walk-ups into one prioritized queue with live SLA clocks,
          a portal your employees will actually use, and on-call rotations built in.
          Runs in the browser — nothing to install on any machine.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
          <Button shape="pill" onClick={startSignup}>Create your workspace</Button>
          <Button shape="pill" variant="secondary" onClick={session.enterDemo}>Explore the live demo</Button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14 }}>
          Free to start · no credit card · the demo needs no account
        </div>
      </div>

      {/* Product strip */}
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            border: '1px solid var(--hairline)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden',
            background: 'var(--surface-1)', boxShadow: '0 30px 80px rgba(0,0,0,.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderBottom: '1px solid var(--hairline-soft)', background: 'var(--surface-2)' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.85 }} />
            ))}
            <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>relay — service desk</span>
          </div>
          <MockQueue />
        </div>
      </div>

      {/* Features */}
      <div id="features" style={{ maxWidth: 1020, margin: '0 auto', padding: '90px 20px 30px' }}>
        <SectionTitle kicker="What you get" title="Everything a service desk needs. Nothing it doesn’t." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginTop: 30 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ border: '1px solid var(--border-card)', background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
              <span style={{ display: 'inline-flex', color: f.tint, marginBottom: 12 }}>{(icons as any)[f.icon]}</span>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, textWrap: 'pretty' }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy anywhere */}
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '60px 20px 20px' }}>
        <div style={{ border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.06)', borderRadius: 'var(--radius-2xl)', padding: 'clamp(22px, 4vw, 40px)', display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 10 }}>Every computer on your network. Zero installs.</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65, textWrap: 'pretty' }}>
              Relay is a secure cloud workspace: your company signs up once, invites the team with two codes
              — one for agents, one for everyone else — and anyone can work from any browser on any machine.
              Each company’s data lives in its own walled-off workspace, enforced server-side.
            </div>
          </div>
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Create the workspace', 'Your first admin signs up and names the company — 60 seconds.'],
              ['Share two invite codes', 'Agents join the desk; employees get the request portal.'],
              ['Work from anywhere', 'Any browser, any OS, any desk — same live queue.'],
            ].map(([t, b], i) => (
              <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, background: 'var(--blue)', color: '#fff' }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{ maxWidth: 1020, margin: '0 auto', padding: '80px 20px 40px' }}>
        <SectionTitle kicker="Pricing" title="Simple per-agent pricing. Requesters are always free." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 30 }}>
          {PLANS.map((p) => (
            <div
              key={p.name}
              style={{
                border: `1px solid ${p.popular ? 'rgba(10,132,255,.5)' : 'var(--border-card)'}`,
                background: p.popular ? 'rgba(10,132,255,.07)' : 'var(--surface-2)',
                borderRadius: 'var(--radius-xl)', padding: 22, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative',
              }}
            >
              {p.popular && (
                <span style={{ position: 'absolute', top: -11, left: 22, fontSize: 10, fontWeight: 800, letterSpacing: '.6px', textTransform: 'uppercase', color: '#fff', background: 'var(--blue)', borderRadius: 'var(--radius-pill)', padding: '3px 10px' }}>
                  Most popular
                </span>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: p.tint }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 2px' }}>
                <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px' }}>{p.price}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-gray)' }}>{p.per}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0 20px' }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
                    <span style={{ color: p.tint, display: 'inline-flex' }}>{icons.check}</span>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto' }}>
                {p.cta === 'Contact sales' ? (
                  <a href="mailto:mgcather07@gmail.com?subject=Relay%20Enterprise" style={{ display: 'block' }}>
                    <Button shape="pill" variant="secondary" style={{ width: '100%' }}>{p.cta}</Button>
                  </a>
                ) : (
                  <Button shape="pill" variant={p.popular ? 'primary' : 'secondary'} style={{ width: '100%' }} onClick={startSignup}>
                    {p.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 18 }}>
          An <b>agent</b> is anyone who works tickets on the desk. Employees who submit requests are always free — invite the whole company.
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
          Early access: every workspace starts free on the Starter plan — upgrade whenever your team outgrows it.
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--hairline-soft)', marginTop: 40 }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '26px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Logo small />
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>© {new Date().getFullYear()} Relay. Help desk software.</span>
          <div style={{ flex: 1 }} />
          <span onClick={session.enterDemo} style={{ fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer' }}>Live demo</span>
          <a href="/docs.html" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Docs</a>
          <a href="#pricing" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Pricing</a>
          <a href="mailto:mgcather07@gmail.com?subject=Relay" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Contact</a>
        </div>
      </div>

      {authMode && <AuthCard mode={authMode} setMode={setAuthMode} />}
    </div>
  )
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: small ? 22 : 26, height: small ? 22 : 26, borderRadius: 8, background: 'var(--sector-navy)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 4px rgba(10,132,255,.18)' }} />
      </div>
      <div style={{ fontSize: small ? 13 : 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-2)' }}>
      {children}
    </a>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--blue-bright)', textTransform: 'uppercase', marginBottom: 10 }}>{kicker}</div>
      <div style={{ fontSize: 'clamp(24px,3.4vw,32px)', fontWeight: 800, letterSpacing: '-.6px', textWrap: 'balance' }}>{title}</div>
    </div>
  )
}

/* A small hand-drawn queue so the hero shows the product without a stale screenshot. */
function MockQueue() {
  const rows = [
    { p: 'var(--red)', id: 'RLY-2841', subj: 'Payroll portal returns 500 for all of Finance', who: 'Dana W. · Finance', status: 'In progress', tone: 'rgba(10,132,255,.16)', toneInk: 'var(--blue-bright)', sla: '26m', slaC: 'var(--orange)' },
    { p: 'var(--orange)', id: 'RLY-2839', subj: 'Cannot reach the shared drive from home', who: 'Luis P. · Remote', status: 'New', tone: 'rgba(100,210,255,.14)', toneInk: 'var(--cyan)', sla: '1h 14m', slaC: 'var(--green)' },
    { p: 'var(--blue)', id: 'RLY-2836', subj: 'New hire setup — starts Monday', who: 'Renée B. · People Ops', status: 'Triage', tone: 'rgba(191,90,242,.16)', toneInk: 'var(--purple)', sla: '7h 40m', slaC: 'var(--green)' },
    { p: 'var(--orange)', id: 'RLY-2834', subj: 'Zoom room drops after five minutes', who: 'Facilities', status: 'In progress', tone: 'rgba(10,132,255,.16)', toneInk: 'var(--blue-bright)', sla: '2h 12m', slaC: 'var(--green)' },
  ]
  return (
    <div style={{ padding: '6px 0 10px', overflowX: 'auto' }}>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '18px minmax(240px,1fr) 150px 110px 76px', gap: 12, alignItems: 'center', minWidth: 660, padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <span style={{ width: 4, height: 26, borderRadius: 2, background: r.p }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{r.id}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subj}</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.who}</span>
          <span style={{ justifySelf: 'start', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: r.tone, color: r.toneInk, whiteSpace: 'nowrap' }}>{r.status}</span>
          <span style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: r.slaC }}>{r.sla}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Auth panel ──────────────────────────────────────────────────────── */

const field: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', background: 'var(--surface-inset)',
  border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)', color: 'var(--ink-1)', fontSize: 14,
}
const authLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase', marginBottom: 7,
}

function AuthCard({ mode, setMode }: { mode: Exclude<AuthMode, null>; setMode: (m: AuthMode) => void }) {
  const session = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async () => {
    setError('')
    setNotice('')
    if (!session.backendAvailable) {
      setError('This deployment isn’t activated yet — accounts are unavailable. The live demo works without one.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') await session.signUp(name, email, password)
      else if (mode === 'signin') await session.signIn(email, password)
      else {
        await session.resetPassword(email)
        setNotice('Reset link sent — check your inbox.')
      }
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<string, [string, string]> = {
    signup: ['Create your account', 'You’ll name your company workspace on the next step.'],
    signin: ['Welcome back', 'Sign in to your company workspace.'],
    reset: ['Reset your password', 'We’ll email you a reset link.'],
  }
  const [title, sub] = titles[mode]

  return (
    <div
      onClick={() => setMode(null)}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(3,5,8,.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 20px 20px', overflowY: 'auto' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400, maxWidth: '94vw', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 24px rgba(0,0,0,.5)', padding: 24, animation: 'relay-pop .2s var(--ease-out)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>{title}</div>
          <div onClick={() => setMode(null)} style={{ fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>Esc</div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 18 }}>{sub}</div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!busy) submit()
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {mode === 'signup' && (
            <div>
              <div style={authLabel}>Your name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Reyes" autoComplete="name" style={field} />
            </div>
          )}
          <div>
            <div style={authLabel}>Work email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" autoComplete="email" style={field} />
          </div>
          {mode !== 'reset' && (
            <div>
              <div style={authLabel}>Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={field}
              />
            </div>
          )}

          {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>}
          {notice && <div style={{ fontSize: 12.5, color: 'var(--green)', lineHeight: 1.5 }}>{notice}</div>}

          <Button shape="pill" disabled={busy} type="submit">
            {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Send reset link'}
          </Button>
        </form>

        <div style={{ display: 'flex', gap: 14, marginTop: 16, fontSize: 12.5 }}>
          {mode !== 'signin' && <span onClick={() => setMode('signin')} style={{ color: 'var(--blue)', cursor: 'pointer' }}>Sign in instead</span>}
          {mode !== 'signup' && <span onClick={() => setMode('signup')} style={{ color: 'var(--blue)', cursor: 'pointer' }}>Create an account</span>}
          {mode === 'signin' && <span onClick={() => setMode('reset')} style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>Forgot password?</span>}
        </div>

        {!session.backendAvailable && (
          <div style={{ marginTop: 16, padding: '10px 12px', border: '1px solid rgba(255,159,10,.3)', background: 'rgba(255,159,10,.08)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--orange)', lineHeight: 1.5 }}>
            Accounts are disabled until this deployment is activated (see scripts/setup.sh). The live demo works without one.
          </div>
        )}
      </div>
    </div>
  )
}

/* Re-export so onboarding can reuse the same badge without another import site. */
export { Badge }
