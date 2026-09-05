import { useRelay } from '../store'
import { Avatar, Badge } from '../ds'
import { icons } from '../lib/icons'
import { sla, prioColor, prioTone, statusTone, AV, type Ticket } from '../lib/data'
import IOSDevice from './IOSFrame'

export default function Mobile() {
  const { state, viewTickets, slaWarnMinutes, me, mode } = useRelay()
  const s = state

  const mineOpen = viewTickets('mine')
  const mobileRows = mineOpen.concat(viewTickets('unassigned')).slice(0, 6)

  const mobT = mobileRows[0] || s.tickets[0] || ({} as Ticket)
  const mobSla = mobT.due ? sla(mobT, s.now, slaWarnMinutes) : { text: '—', color: 'var(--ink-2)' as string }
  const mobThread = (mobT.thread || []).slice(0, 4)

  const tabs = [
    { label: 'Queue', icon: icons.inbox, tint: 'var(--blue)' },
    { label: 'Mine', icon: icons.user, tint: 'var(--ink-3)' },
    { label: 'Search', icon: icons.search, tint: 'var(--ink-3)' },
    { label: 'Alerts', icon: icons.bell, tint: 'var(--ink-3)' },
    { label: 'More', icon: icons.chart, tint: 'var(--ink-3)' },
  ]

  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))',
        justifyItems: 'center',
        alignItems: 'start',
        gap: 40,
        padding: '36px 24px 80px',
      }}
    >
      {/* Frame 1 — my queue */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <IOSDevice dark>
          <div
            style={{
              height: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--app-bg)',
              fontFamily: 'var(--font-system)',
              color: 'var(--ink-1)',
              overflow: 'hidden',
              paddingTop: 52,
            }}
          >
            <div style={{ padding: '8px 18px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>
                    Assigned to me
                  </div>
                  <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.6px', marginTop: 2 }}>{mineOpen.length} open</div>
                </div>
                <Avatar name={me.name} size={AV.xl} ring />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 12px',
                  marginTop: 12,
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--hairline-soft)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--ink-3)',
                  fontSize: 13,
                }}
              >
                {icons.search}
                <span>Search my tickets</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mobileRows.map((m) => {
                const sl = sla(m, s.now, slaWarnMinutes)
                return (
                  <div key={m.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '13px 14px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <span style={{ width: 4, alignSelf: 'stretch', minHeight: 38, borderRadius: 2, background: prioColor(m.priority) }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{m.id}</span>
                        <Badge tone={statusTone(m.status) as any}>{m.status === 'Waiting on user' ? 'Waiting' : m.status}</Badge>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 7 }}>{m.subj}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--ink-gray)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.requester} · {m.dept}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: sl.color }}>
                          {icons.clock}
                          {sl.text}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div style={{ height: 70 }} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 14,
                right: 14,
                bottom: 26,
                height: 58,
                borderRadius: 22,
                background: 'rgba(28,32,38,.72)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              }}
            >
              {tabs.map((t) => (
                <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.tint }}>
                  {t.icon}
                  <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.2px' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </IOSDevice>
        <div style={{ fontSize: 12, color: 'var(--ink-gray)' }}>Agent app — my queue, live SLA</div>
      </div>

      {/* Frame 2 — ticket detail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <IOSDevice dark>
          <div
            style={{
              height: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--app-bg)',
              fontFamily: 'var(--font-system)',
              color: 'var(--ink-1)',
              overflow: 'hidden',
              paddingTop: 52,
            }}
          >
            <div style={{ padding: '6px 18px 12px', borderBottom: '1px solid var(--hairline-soft)', flexShrink: 0 }}>
              <div style={{ fontSize: 11.5, color: 'var(--blue)', fontWeight: 600 }}>← My queue</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{mobT.id}</span>
                <Badge tone={prioTone(mobT.priority) as any} solid>
                  {mobT.priority}
                </Badge>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: mobSla.color }}>{mobSla.text} left</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25, marginTop: 8 }}>{mobT.subj}</div>
              {mode === 'demo' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginTop: 10,
                    padding: '5px 10px 5px 6px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(52,199,89,.12)',
                    border: '1px solid rgba(52,199,89,.3)',
                    alignSelf: 'flex-start',
                    width: 'fit-content',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'relay-pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-bright)' }}>Dana R. is viewing · Tomás typing</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mobThread.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: m.internal ? 'rgba(255,214,10,.07)' : 'var(--surface-2)',
                    border: `1px solid ${m.internal ? 'rgba(255,214,10,.28)' : 'var(--border-card)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '11px 13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <Avatar name={m.author} size={AV.sm} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{m.author}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-1)', whiteSpace: 'pre-wrap' }}>{m.body}</div>
                </div>
              ))}
              <div style={{ height: 90 }} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 14,
                right: 14,
                bottom: 26,
                display: 'flex',
                gap: 9,
                alignItems: 'center',
                padding: 10,
                borderRadius: 22,
                background: 'rgba(28,32,38,.78)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid var(--hairline)',
                boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              }}
            >
              <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-3)', paddingLeft: 6 }}>Reply to {(mobT.requester || '').split(' ')[0]}…</div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,214,10,.16)', border: '1px solid rgba(255,214,10,.35)', display: 'grid', placeItems: 'center', color: 'var(--yellow)' }}>
                {icons.lock}
              </div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--blue)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                {icons.send}
              </div>
            </div>
          </div>
        </IOSDevice>
        <div style={{ fontSize: 12, color: 'var(--ink-gray)' }}>Same ticket, live — internal note vs public reply</div>
      </div>
    </div>
  )
}
