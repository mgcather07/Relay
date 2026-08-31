import { useRelay } from '../store'
import { Badge, Button, FilterChip, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { sla, prioColor, statusTone, dur, kb, type Ticket } from '../lib/data'

export default function Portal() {
  const { state, setState, agent, submitPortal, toast, slaWarnMinutes } = useRelay()
  const s = state

  const portalMine = s.tickets.filter((x) => x.requester === 'Marcus Cathey')
  const pdT = s.tickets.find((x) => x.id === s.portalOpenId) || portalMine[0] || ({} as Ticket)
  const pdSla = pdT.due ? sla(pdT, s.now, slaWarnMinutes) : { text: '—', color: 'var(--ink-2)' as string }

  const routeHint =
    'Routes to ' +
    (s.pf.category || 'the right team') +
    ' · ' +
    (s.pf.impact === 'Whole team' ? 'P1 · 4h target' : s.pf.impact === 'Blocking my work' ? 'P2 · 8h target' : 'P3 · 24h target')

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 100px' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>
              Relay help center
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.5px', marginTop: 6 }}>Hey Marcus — 2 requests open</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4 }}>Track what you've asked for, or start something new.</div>
          </div>
          <Button shape="pill" size="sm" onClick={() => setState({ portalPage: 'new' })} icon={icons.plus}>
            New request
          </Button>
        </div>

        {/* List */}
        {s.portalPage === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {portalMine.map((x) => {
              const sl = sla(x, s.now, slaWarnMinutes)
              const a = agent(x.assignee)
              return (
                <div
                  key={x.id}
                  className="relay-card-hover"
                  onClick={() => setState({ portalPage: 'detail', portalOpenId: x.id })}
                  style={{
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--surface-2)',
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span style={{ width: 4, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, background: prioColor(x.priority) }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>{x.subj}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-gray)' }}>
                      {x.id} · opened {x.opened} · {a ? 'with ' + a.name : 'waiting for a tech'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <Badge tone={statusTone(x.status) as any}>{x.status}</Badge>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
                      {x.status === 'Resolved' ? 'Closed' : sl.text + ' to target'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* New request */}
        {s.portalPage === 'new' && (
          <div style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-2)', padding: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>What do you need?</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 18 }}>Relay routes this to the right team automatically.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={sublabel}>Summary</div>
                <input
                  value={s.pf.subject}
                  onChange={(e) => setState({ pf: { ...s.pf, subject: e.target.value } })}
                  placeholder="e.g. Laptop won't connect to the VPN"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    background: 'var(--surface-inset)',
                    border: `1px solid ${s.pf.tried && !s.pf.subject.trim() ? 'var(--red)' : 'var(--hairline-soft)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--ink-1)',
                    fontSize: 14,
                  }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 6, opacity: s.pf.tried && !s.pf.subject.trim() ? 1 : 0 }}>
                  Give us a one-line summary so we can route it.
                </div>
              </div>
              <div>
                <div style={sublabel}>Category</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {s.cats.map((c) => (
                    <FilterChip key={c} selected={s.pf.category === c} onClick={() => setState({ pf: { ...s.pf, category: c } })}>
                      {c}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <div style={sublabel}>How much is it blocking you?</div>
                <SegmentedControl
                  segments={['Annoying', 'Blocking my work', 'Whole team']}
                  value={s.pf.impact}
                  onChange={(v) => setState({ pf: { ...s.pf, impact: v } })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div style={sublabel}>Details</div>
                <textarea
                  value={s.pf.body}
                  onChange={(e) => setState({ pf: { ...s.pf, body: e.target.value } })}
                  placeholder="When did it start? What have you already tried?"
                  style={{
                    width: '100%',
                    minHeight: 110,
                    resize: 'vertical',
                    padding: '12px 14px',
                    background: 'var(--surface-inset)',
                    border: '1px solid var(--hairline-soft)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--ink-1)',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                  }}
                />
              </div>

              {s.pf.subject.trim().length > 6 && (
                <div style={{ border: '1px solid rgba(100,210,255,.28)', background: 'rgba(100,210,255,.08)', borderRadius: 'var(--radius-lg)', padding: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 9 }}>
                    This might solve it right now
                  </div>
                  {kb.slice(0, 2).map((k) => (
                    <div key={k.title} style={{ padding: '6px 0' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{k.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 2 }}>{k.excerpt}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <Button shape="pill" onClick={submitPortal}>
                  Send to Relay
                </Button>
                <div onClick={() => setState({ portalPage: 'list' })} style={{ fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                  Cancel
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 12, color: 'var(--ink-gray)' }}>{routeHint}</div>
              </div>
            </div>
          </div>
        )}

        {/* Detail */}
        {s.portalPage === 'detail' && (
          <div style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-2)', padding: 20 }}>
            <div onClick={() => setState({ portalPage: 'list' })} style={{ fontSize: 12.5, color: 'var(--blue)', cursor: 'pointer', marginBottom: 14 }}>
              ← All my requests
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.2px' }}>{pdT.subj}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <Badge tone={statusTone(pdT.status) as any}>{pdT.status}</Badge>
              <span style={{ fontSize: 12, color: 'var(--ink-gray)' }}>
                {pdT.id} · {pdT.category} · {pdT.status === 'Resolved' ? 'Closed' : pdSla.text + ' to target'}
              </span>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  title: 'Request received',
                  time: pdT.opened || 'earlier',
                  body: 'Relay routed this to ' + (pdT.team || 'Desktop Support') + ' and set a ' + dur((pdT.window || 1440) * 60000) + ' target.',
                  tint: 'var(--blue)',
                },
                {
                  title: 'Picked up',
                  time: '+4m',
                  body: (agent(pdT.assignee) || { name: 'A technician' }).name + ' is on it. You will get an email on every update.',
                  tint: 'var(--cyan)',
                },
                {
                  title: 'Waiting on you',
                  time: '+1h',
                  body: 'Can you confirm which desk you are using so we can stage the hardware? Reply below.',
                  tint: 'var(--yellow)',
                },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', paddingTop: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.tint, flexShrink: 0 }} />
                    <span style={{ flex: 1, width: 2, background: 'var(--hairline-soft)', minHeight: 22 }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 3 }}>{e.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid var(--hairline-soft)', paddingTop: 16 }}>
              <input
                value={s.pdReply}
                onChange={(e) => setState({ pdReply: e.target.value })}
                placeholder="Add a comment for the technician…"
                style={{
                  flex: 1,
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--hairline-soft)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--ink-1)',
                  fontSize: 13.5,
                }}
              />
              <Button
                shape="pill"
                size="sm"
                onClick={() => {
                  if (!s.pdReply.trim()) return
                  setState({ pdReply: '' })
                  toast('Comment sent to the technician', 'var(--green)')
                }}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const sublabel: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--ink-gray)',
  textTransform: 'uppercase',
  marginBottom: 7,
}
