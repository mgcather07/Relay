import { useRelay } from '../store'
import { Avatar } from '../ds'
import { icons } from '../lib/icons'
import { teams, AV, monday, onCallFor, fmtDay } from '../lib/data'
import { useIsCompact } from '../lib/useMediaQuery'

export default function DeskSidebar() {
  const { state, setState, viewTickets, visible } = useRelay()
  const compact = useIsCompact()
  const s = state
  const close = () => setState({ navOpen: false })

  const counts: Record<string, number> = {
    inbox: viewTickets('inbox').length,
    mine: viewTickets('mine').length,
    unassigned: viewTickets('unassigned').length,
    breaching: viewTickets('breaching').length,
    waiting: viewTickets('waiting').length,
    resolved: viewTickets('resolved').length,
  }

  const viewDefs: [string, string, React.ReactNode, string][] = [
    ['inbox', 'All open', icons.inbox, 'var(--ink-2)'],
    ['mine', 'Assigned to me', icons.user, 'var(--blue)'],
    ['unassigned', 'Unassigned', icons.bell, 'var(--orange)'],
    ['breaching', 'Breaching soon', icons.warn, 'var(--red)'],
    ['waiting', 'Waiting on user', icons.clock, 'var(--yellow)'],
    ['resolved', 'Resolved', icons.check, 'var(--green)'],
  ]

  const mon = monday(new Date(s.now))
  const ocSidebar = onCallFor('hd', mon)!
  const ocWeekLabel = 'Week of ' + fmtDay(mon)

  const panelStyle: React.CSSProperties = compact
    ? {
        width: 264,
        maxWidth: '82vw',
        height: '100%',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        background: '#0A0D12',
        borderRight: '1px solid var(--hairline-soft)',
        overflowY: 'auto',
      }
    : {
        width: 236,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline-soft)',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        background: '#0A0D12',
      }

  const panel = (
    <div style={panelStyle}>
      {/* Compact-only header with close */}
      {compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>
          <div onClick={close} className="relay-hover-white" style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, cursor: 'pointer', color: 'var(--ink-2)' }}>
            {icons.close}
          </div>
        </div>
      )}

      {/* Views */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={label}>Views</div>
        {viewDefs.map(([k, lbl, icon, tint]) => {
          const active = s.view === k && s.page === 'queue'
          return (
            <div
              key={k}
              className="relay-nav-hover"
              onClick={() => setState({ page: 'queue', view: k, selected: [], navOpen: false })}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)', background: 'rgba(10,132,255,.14)', border: '1px solid rgba(10,132,255,.28)', pointerEvents: 'none', opacity: active ? 1 : 0 }} />
              <span style={{ display: 'inline-flex', color: tint, position: 'relative' }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: s.view === k ? 600 : 500, color: s.view === k ? 'var(--ink-1)' : 'var(--ink-2)', position: 'relative' }}>{lbl}</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: s.view === k ? 'var(--ink-1)' : 'var(--ink-3)', position: 'relative' }}>{counts[k]}</span>
            </div>
          )
        })}
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={label}>Teams</div>
        {teams.map((t) => {
          const on = s.filters.indexOf(t.name) >= 0
          const count = s.tickets.filter((x) => x.team === t.name && visible(x)).length
          return (
            <div
              key={t.name}
              className="relay-nav-hover"
              title={t.name + ' — open tickets owned by this team'}
              onClick={() =>
                setState((st) => ({
                  page: 'queue',
                  navOpen: false,
                  filters: on
                    ? st.filters.filter((x) => x !== t.name)
                    : st.filters.filter((x) => !teams.some((g) => g.name === x)).concat([t.name]),
                }))
              }
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 2, background: t.tint }} />
              <span style={{ flex: 1, fontSize: 13, color: on ? 'var(--ink-1)' : 'var(--ink-2)' }}>{t.name}</span>
              <span style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{count}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 12 }} />

      {/* On-call card */}
      <div
        className="relay-oncall-hover"
        onClick={() => setState({ surface: 'Desk', page: 'oncall', navOpen: false })}
        style={{ border: '1px solid rgba(255,214,10,.28)', background: 'rgba(255,214,10,.07)', borderRadius: 'var(--radius-lg)', padding: '11px 12px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--yellow)', animation: 'relay-pulse 2.4s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--yellow)', textTransform: 'uppercase' }}>On call · helpdesk</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{ocSidebar.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', fontVariantNumeric: 'tabular-nums' }}>
          {ocSidebar.ext} · {ocWeekLabel}
        </div>
      </div>

      {/* SLA dashboard + Settings */}
      <div className="relay-soft-hover relay-hover-white" onClick={() => setState({ page: 'dashboard', navOpen: false })} style={navRow}>
        {icons.chart}
        <span>SLA dashboard</span>
      </div>
      <div className="relay-soft-hover relay-hover-white" onClick={() => setState({ surface: 'Desk', page: 'settings', navOpen: false })} style={navRow}>
        {icons.gear}
        <span>Settings</span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Marcus Cathey" size={AV.md} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Marcus Cathey</div>
          <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>Desktop Support · Lead</div>
        </div>
      </div>
    </div>
  )

  if (!compact) return panel

  // Drawer mode — only mounted while open (avoids an always-on full-viewport
  // backdrop-filter that would keep the compositor busy).
  if (!s.navOpen) return null
  return (
    <>
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(3,5,8,.55)', animation: 'relay-in var(--duration-base) var(--ease-standard)' }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 46,
          boxShadow: '0 8px 24px rgba(0,0,0,.45)',
          animation: 'relay-drawer-in var(--duration-base) var(--ease-out)',
        }}
      >
        {panel}
      </div>
    </>
  )
}

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--ink-gray)',
  textTransform: 'uppercase',
  padding: '0 8px 8px',
}

const navRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: 8,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  color: 'var(--ink-2)',
  fontSize: 13,
}
