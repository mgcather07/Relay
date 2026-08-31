import { useRelay } from '../store'
import { Avatar } from '../ds'
import { icons } from '../lib/icons'
import { teams, AV, monday, onCallFor, fmtDay } from '../lib/data'

export default function DeskSidebar() {
  const { state, setState, viewTickets, visible } = useRelay()
  const s = state

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

  return (
    <div
      style={{
        width: 236,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline-soft)',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        background: '#0A0D12',
      }}
    >
      {/* Views */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={label}>Views</div>
        {viewDefs.map(([k, lbl, icon, tint]) => {
          const active = s.view === k && s.page === 'queue'
          return (
            <div
              key={k}
              className="relay-nav-hover"
              onClick={() => setState({ page: 'queue', view: k, selected: [] })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(10,132,255,.14)',
                  border: '1px solid rgba(10,132,255,.28)',
                  pointerEvents: 'none',
                  opacity: active ? 1 : 0,
                }}
              />
              <span style={{ display: 'inline-flex', color: tint, position: 'relative' }}>{icon}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  fontWeight: s.view === k ? 600 : 500,
                  color: s.view === k ? 'var(--ink-1)' : 'var(--ink-2)',
                  position: 'relative',
                }}
              >
                {lbl}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: s.view === k ? 'var(--ink-1)' : 'var(--ink-3)',
                  position: 'relative',
                }}
              >
                {counts[k]}
              </span>
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
                  filters: on
                    ? st.filters.filter((x) => x !== t.name)
                    : st.filters.filter((x) => !teams.some((g) => g.name === x)).concat([t.name]),
                }))
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 2, background: t.tint }} />
              <span style={{ flex: 1, fontSize: 13, color: on ? 'var(--ink-1)' : 'var(--ink-2)' }}>{t.name}</span>
              <span style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{count}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* On-call card */}
      <div
        className="relay-oncall-hover"
        onClick={() => setState({ surface: 'Desk', page: 'oncall' })}
        style={{
          border: '1px solid rgba(255,214,10,.28)',
          background: 'rgba(255,214,10,.07)',
          borderRadius: 'var(--radius-lg)',
          padding: '11px 12px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--yellow)', animation: 'relay-pulse 2.4s infinite' }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 'var(--tracking-label)',
              color: 'var(--yellow)',
              textTransform: 'uppercase',
            }}
          >
            On call · helpdesk
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{ocSidebar.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', fontVariantNumeric: 'tabular-nums' }}>
          {ocSidebar.ext} · {ocWeekLabel}
        </div>
      </div>

      {/* SLA dashboard + Settings */}
      <div
        className="relay-soft-hover relay-hover-white"
        onClick={() => setState({ page: 'dashboard' })}
        style={navRow}
      >
        {icons.chart}
        <span>SLA dashboard</span>
      </div>
      <div
        className="relay-soft-hover relay-hover-white"
        onClick={() => setState({ surface: 'Desk', page: 'settings' })}
        style={navRow}
      >
        {icons.gear}
        <span>Settings</span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Marcus Cathey" size={AV.md} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Marcus Cathey
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>Desktop Support · Lead</div>
        </div>
      </div>
    </div>
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
