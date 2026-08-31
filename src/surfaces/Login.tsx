import { useRelay } from '../store'
import { Avatar, Badge } from '../ds'
import { personas, ROLE_LABEL, ROLE_TINT, capsFor, AV, type Role } from '../lib/data'
import { useIsPhone } from '../lib/useMediaQuery'

const roleTone: Record<Role, any> = {
  developer: 'purple',
  admin: 'poor',
  manager: 'purple',
  staff: 'cyan',
  helpdesk: 'accent',
  employee: 'prime',
}

function accessSummary(role: Role) {
  const c = capsFor(role)
  if (c.isEmployee) return 'Help center — submit & track own requests'
  const parts = ['Ticket queue']
  if (c.canDashboard) parts.push('dashboards')
  if (c.canSettings) parts.push(c.settingsSections.length > 3 ? 'full settings' : 'team reports')
  return parts.join(' · ')
}

export default function Login() {
  const { signIn } = useRelay()
  const phone = useIsPhone()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: phone ? '48px 16px' : '72px 24px', background: 'radial-gradient(1200px 600px at 50% -10%, rgba(10,132,255,.10), transparent 60%), var(--app-bg)' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--sector-navy)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 5px rgba(10,132,255,.18)' }} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '1.6px' }}>RELAY</div>
        </div>

        <div style={{ fontSize: phone ? 26 : 30, fontWeight: 800, letterSpacing: '-.5px' }}>Sign in to Relay</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.55, maxWidth: 480 }}>
          In production Relay signs you in with your Active Directory account, and what you can see is set automatically by your
          directory group. For this preview, choose an account to see the experience for each role.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {personas.map((p) => (
            <div
              key={p.id}
              className="relay-card-hover"
              onClick={() => signIn(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '14px 16px',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-2)',
                cursor: 'pointer',
              }}
            >
              <Avatar name={p.name} size={AV.xl} ring />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                  <Badge tone={roleTone[p.role]}>{ROLE_LABEL[p.role]}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-gray)', marginTop: 3 }}>{p.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{accessSummary(p.role)}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: ROLE_TINT[p.role] }} />
                {!phone && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-system)' }}>Sign in →</span>}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 22, lineHeight: 1.5 }}>
          Demo accounts only — no real authentication. Roles map to the LDAP groups configured under Settings → Directory.
        </div>
      </div>
    </div>
  )
}
