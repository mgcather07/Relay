import { useRelay } from '../store'
import { Avatar, Badge, Button, Card, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { sla, prioColor, prioWord, prioTone, statusTone, dur, AV, type KBArticle, type Ticket } from '../lib/data'

const VIEW_TITLES: Record<string, string> = {
  inbox: 'All open tickets',
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
  breaching: 'Breaching soon',
  waiting: 'Waiting on user',
  resolved: 'Resolved',
}

function kbFor(kb: KBArticle[], tk: Ticket) {
  const key = ((tk.category || '') + ' ' + (tk.subj || '')).toLowerCase()
  const hit = kb.filter((k) => k.tags.some((g) => key.indexOf(g) >= 0))
  return (hit.length ? hit : kb).slice(0, 3)
}

const MACROS = [
  {
    label: 'Ask for a screenshot',
    text: 'Could you send a screenshot of the exact error, including the URL bar? That will tell us whether this is the SSO layer or the app itself.',
  },
  {
    label: 'Escalating now',
    text: 'I am escalating this to the Applications team now and staying on it. You will hear from me within 20 minutes either way.',
  },
  {
    label: 'Fixed — confirm?',
    text: 'The fix is in. Please try again and let me know if you are through — I will keep this open until you confirm.',
  },
]

export default function TicketDetail() {
  const { state, setState, openTicket, agent, genThread, resolveOpen, sendReply, toast, slaWarnMinutes, openDetail, kb, me, isMe, mode } = useRelay()
  const s = state
  const t = openTicket() || ({} as Ticket)
  const osla = sla(t.due ? t : ({ due: Date.now(), window: 240, status: 'New' } as any), s.now, slaWarnMinutes)
  const oa = agent(t.assignee)
  const oviewers = (t.viewers || []).map((v) => agent(v)).filter(Boolean) as any[]
  const thread = (t.thread || (t.id ? genThread(t) : [])).map((m) => ({
    ...m,
    internal: !!m.internal,
    bg: m.internal ? 'rgba(255,214,10,.07)' : 'var(--surface-2)',
    border: m.internal ? 'rgba(255,214,10,.28)' : 'var(--border-card)',
  }))
  const internalMode = s.replyMode !== 'Public reply'

  const priorCount = s.tickets.filter((x) => x.requester === t.requester).length
  const facts = [
    { k: 'Ticket', v: t.id },
    { k: 'Channel', v: t.channel },
    { k: 'Category', v: t.category },
    { k: 'Asset', v: t.asset || 'None linked' },
    { k: 'Prior tickets', v: mode === 'demo' ? '3 in 90 days' : priorCount + ' total' },
  ]
  const links = (t.links || []).map((id) => {
    const lt = s.tickets.find((x) => x.id === id) || ({} as Ticket)
    return { id, subj: lt.subj || id, meta: id + ' · ' + (lt.status || ''), tint: prioColor(lt.priority) }
  })
  const kbSuggestions = kbFor(kb, t)

  return (
    <div style={{ display: 'flex', minHeight: 0, alignItems: 'stretch', flexWrap: 'wrap' }}>
      {/* Thread column */}
      <div
        style={{
          flex: '1 1 460px',
          minWidth: 'min(100%,420px)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--hairline-soft)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ink-gray)', marginBottom: 9 }}>
            <span onClick={() => setState({ page: 'queue' })} style={{ cursor: 'pointer', color: 'var(--blue)' }}>
              ← {VIEW_TITLES[s.view]}
            </span>
            <span>/</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>{t.id}</span>
            <div style={{ flex: 1 }} />
            {oviewers.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(52,199,89,.12)',
                  border: '1px solid rgba(52,199,89,.3)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'relay-pulse 2s infinite' }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green-bright)' }}>
                  {oviewers.map((v) => v.name.split(' ')[0]).join(', ')} {oviewers.length > 1 ? 'are' : 'is'} viewing this
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 3, background: prioColor(t.priority) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-.2px', lineHeight: 1.25 }}>{t.subj}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                <Badge tone={prioTone(t.priority) as any} solid>
                  {t.priority} {prioWord(t.priority)}
                </Badge>
                <Badge tone={statusTone(t.status) as any}>{t.status}</Badge>
                <span style={{ fontSize: 12, color: 'var(--ink-gray)' }}>
                  {t.category} · opened {t.opened} · {t.msgs} messages
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Button size="sm" variant="secondary" shape="pill" onClick={() => setState({ merge: true })} icon={icons.link}>
                Link
              </Button>
              <Button size="sm" shape="pill" onClick={resolveOpen} icon={icons.check}>
                {t.status === 'Resolved' ? 'Reopen' : 'Resolve'}
              </Button>
            </div>
          </div>
        </div>

        {/* Thread + composer */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {thread.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar name={m.author} size={AV.lg} />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: m.bg,
                  border: `1px solid ${m.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{m.author}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{m.role}</span>
                  {m.internal && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-label)',
                        textTransform: 'uppercase',
                        color: 'var(--yellow)',
                      }}
                    >
                      {icons.lock}Internal note
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-1)', textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>
                  {m.body}
                </div>
              </div>
            </div>
          ))}

          {oviewers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 46, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--yellow)', animation: 'relay-pulse 1.2s infinite' }} />
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--yellow)', animation: 'relay-pulse 1.2s infinite .2s' }} />
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--yellow)', animation: 'relay-pulse 1.2s infinite .4s' }} />
              </span>
              {oviewers[0].name.split(' ')[0]} is typing an internal note…
            </div>
          )}

          {/* Composer */}
          <div
            style={{
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: internalMode ? 'rgba(255,214,10,.06)' : 'var(--surface-1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--hairline-soft)' }}>
              <SegmentedControl
                segments={['Public reply', 'Internal note']}
                value={s.replyMode}
                onChange={(v) => setState({ replyMode: v })}
              />
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>
                {internalMode ? 'Only the service desk sees this' : 'Goes to ' + (t.requester || 'the requester') + ' by email'}
              </span>
            </div>
            <textarea
              value={s.replyText}
              onChange={(e) => setState({ replyText: e.target.value })}
              placeholder={internalMode ? 'Note for the next tech on shift…' : 'Write back to ' + (t.requester || 'the requester') + '…'}
              style={{
                width: '100%',
                minHeight: 92,
                resize: 'vertical',
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-1)',
                fontSize: 13.5,
                lineHeight: 1.55,
                padding: '12px 14px',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--hairline-soft)' }}>
              {MACROS.map((k) => (
                <div
                  key={k.label}
                  className="relay-macro-hover"
                  onClick={() => setState({ replyText: k.text })}
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    padding: '5px 10px',
                    border: '1px solid var(--hairline-soft)',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                  }}
                >
                  {k.label}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <Button size="sm" shape="pill" onClick={sendReply} disabled={!s.replyText.trim()}>
                {internalMode ? 'Save note' : 'Send reply'}
              </Button>
            </div>
          </div>
          <div style={{ height: 60 }} />
        </div>
      </div>

      {/* Right rail */}
      <div
        style={{
          flex: '1 1 300px',
          minWidth: 'min(100%,300px)',
          maxWidth: 360,
          padding: '18px 18px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: '#0A0D12',
        }}
      >
        <Card caption="Resolution SLA">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', color: osla.color }}>
              {osla.text}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-gray)' }}>{osla.caption}</div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: osla.color, width: osla.pct + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5, color: 'var(--ink-gray)' }}>
            <span>Target {dur((t.window || 240) * 60000)}</span>
            <span>{mode === 'demo' ? 'First reply met in 7m' : prioWord(t.priority) + ' priority'}</span>
          </div>
        </Card>

        <Card caption="Assignment">
          <div
            onClick={() => setState({ assignFor: s.openId })}
            style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', padding: '2px 0' }}
          >
            <Avatar name={oa ? oa.name : ''} size={AV.xl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {oa ? (isMe(oa.id) ? me.name + ' (you)' : oa.name) : 'Unassigned'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{t.team}</div>
            </div>
            <span style={{ color: 'var(--ink-3)' }}>{icons.chevron}</span>
          </div>
        </Card>

        <Card caption="Requester">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
            <Avatar name={t.requester || ''} size={AV.xl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.requester}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>
                {(t.dept || '') + ' · ' + (t.channel || '')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--hairline-soft)', paddingTop: 6 }}>
            {facts.map((f) => (
              <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-gray)', width: 96, flexShrink: 0 }}>{f.k}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500, textAlign: 'right', flex: 1 }}>{f.v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card caption="Linked tickets">
          {links.map((l) => (
            <div
              key={l.id}
              onClick={() => openDetail(l.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 0',
                cursor: 'pointer',
                borderBottom: '1px solid var(--hairline-soft)',
              }}
            >
              <span style={{ width: 4, height: 20, borderRadius: 2, background: l.tint }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.subj}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>{l.meta}</div>
              </div>
            </div>
          ))}
          <div onClick={() => setState({ merge: true })} style={{ fontSize: 12.5, color: 'var(--blue)', cursor: 'pointer', paddingTop: 9 }}>
            Link or merge a ticket…
          </div>
        </Card>

        {kbSuggestions.length > 0 && (
        <Card caption="Suggested from knowledge base">
          {kbSuggestions.map((k) => (
            <div key={k.title} style={{ padding: '9px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--cyan)' }}>{k.match}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600 }}>{k.title}</div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 4 }}>{k.excerpt}</div>
              <div
                onClick={() => {
                  setState({ replyText: k.excerpt, replyMode: 'Public reply' })
                  toast('Article inserted into the reply', 'var(--cyan)')
                }}
                style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer', marginTop: 6 }}
              >
                Insert into reply
              </div>
            </div>
          ))}
        </Card>
        )}
      </div>
    </div>
  )
}
