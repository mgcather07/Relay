import { useEffect, useRef } from 'react'
import { useRelay } from '../store'
import { Avatar, Button, FilterChip, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { monday, prioColor, prioWord, AV } from '../lib/data'

const sublabel: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--ink-gray)',
  textTransform: 'uppercase',
  marginBottom: 7,
}

const PRIO_META: Record<string, { target: string; reply: string }> = {
  P1: { target: '4h', reply: '15m first reply' },
  P2: { target: '8h', reply: '30m first reply' },
  P3: { target: '24h', reply: '4h first reply' },
  P4: { target: '48h', reply: '1d first reply' },
}

export default function NewTicketModal() {
  const { state, setState, closeOverlays, createTicket, toast, agents, tracks, onCall, trackForCategory, contactFor, isMe, nextTicketLabel } = useRelay()
  const s = state
  const subjectRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (s.composer) setTimeout(() => subjectRef.current?.focus(), 30)
  }, [s.composer])

  if (!s.composer) return null

  const nf = s.nf
  const invalid = nf.tried && (!nf.subject.trim() || !nf.requester.trim())

  const mon = monday(new Date(s.now))
  const nfTrackId = trackForCategory(nf.category)
  const nfTrack = tracks.find((t) => t.id === nfTrackId)
  const nfOc = nfTrack ? onCall(nfTrackId, mon) : null
  const nfOcContact = nfOc ? contactFor(nfOc.name) : null

  const loadTint = (n: number) => (n > 10 ? 'var(--red)' : n > 7 ? 'var(--orange)' : 'var(--green)')

  const assignOptions: { id: string; label: string; name: string; load: number | null }[] = [
    { id: '', label: 'Leave in pool', name: '', load: null },
    ...agents
      .slice()
      .sort((a, b) => (isMe(a.id) ? -1 : isMe(b.id) ? 1 : a.load - b.load))
      .map((a) => ({ id: a.id, label: isMe(a.id) ? 'Me' : a.short, name: a.name, load: a.load })),
  ]

  return (
    <div
      onClick={closeOverlays}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault()
          createTicket()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 75,
        background: 'rgba(3,5,8,.66)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5vh 20px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxWidth: '96vw',
          maxHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          overflow: 'hidden',
          animation: 'relay-pop .2s var(--ease-out)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(10,132,255,.14)',
              border: '1px solid rgba(10,132,255,.3)',
              color: 'var(--blue)',
            }}
          >
            {icons.plus}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>New ticket</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)', background: 'var(--surface-inset)', border: '1px solid var(--hairline-soft)', borderRadius: 6, padding: '2px 7px' }}>
                {nextTicketLabel}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-gray)', marginTop: 2 }}>Logging on behalf of a caller — the SLA clock starts on create.</div>
          </div>
          <div onClick={closeOverlays} style={{ fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer', flexShrink: 0 }}>
            Esc
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minHeight: 0, flex: 1 }}>
          <div>
            <div style={sublabel}>Subject</div>
            <input
              ref={subjectRef}
              value={nf.subject}
              onChange={(e) => setState({ nf: { ...nf, subject: e.target.value } })}
              placeholder="One line — what's broken?"
              style={{
                width: '100%',
                height: 46,
                padding: '0 14px',
                background: 'var(--surface-inset)',
                border: `1px solid ${nf.tried && !nf.subject.trim() ? 'var(--red)' : 'var(--hairline-soft)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--ink-1)',
                fontSize: 14.5,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={sublabel}>Requester</div>
              <input
                value={nf.requester}
                onChange={(e) => setState({ nf: { ...nf, requester: e.target.value } })}
                placeholder="Name or email"
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--surface-inset)',
                  border: `1px solid ${nf.tried && !nf.requester.trim() ? 'var(--red)' : 'var(--hairline-soft)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--ink-1)',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <div style={sublabel}>Channel</div>
              <SegmentedControl segments={s.channels} value={nf.channel} onChange={(v) => setState({ nf: { ...nf, channel: v } })} style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div style={sublabel}>Category</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {s.cats.map((c) => (
                <FilterChip key={c} selected={nf.category === c} onClick={() => setState({ nf: { ...nf, category: c } })}>
                  {c}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Priority cards */}
          <div>
            <div style={sublabel}>Priority</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
              {(['P1', 'P2', 'P3', 'P4'] as const).map((p) => {
                const sel = nf.priority === p
                const tint = prioColor(p)
                return (
                  <div
                    key={p}
                    onClick={() => setState({ nf: { ...nf, priority: p } })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      border: `1px solid ${sel ? tint : 'var(--hairline-soft)'}`,
                      background: sel ? `color-mix(in srgb, ${tint} 12%, transparent)` : 'var(--surface-inset)',
                      transition: 'border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: tint, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: sel ? 'var(--ink-1)' : 'var(--ink-2)' }}>
                        {p} · {prioWord(p)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: sel ? 'var(--ink-2)' : 'var(--ink-3)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                      {PRIO_META[p].target} target · {PRIO_META[p].reply}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Assign to */}
          <div>
            <div style={sublabel}>Assign to</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {assignOptions.map((a) => {
                const sel = nf.assignee === a.id
                return (
                  <div
                    key={a.id || '__pool'}
                    onClick={() => setState({ nf: { ...nf, assignee: a.id } })}
                    title={a.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: a.id ? '5px 10px 5px 5px' : '5px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: `1px solid ${sel ? 'var(--blue)' : 'var(--hairline-soft)'}`,
                      background: sel ? 'rgba(10,132,255,.16)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {a.id ? <Avatar name={a.name} size={AV.sm} /> : <span style={{ display: 'inline-flex', color: 'var(--orange)' }}>{icons.inbox}</span>}
                    <span style={{ fontSize: 12.5, color: sel ? 'var(--ink-1)' : 'var(--ink-2)' }}>{a.label}</span>
                    {a.load !== null && (
                      <span
                        title={a.load + ' open tickets'}
                        style={{ fontSize: 10.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: loadTint(a.load), background: 'rgba(255,255,255,.06)', borderRadius: 'var(--radius-pill)', padding: '1px 7px' }}
                      >
                        {a.load}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* On-call strip */}
          {nfOc && nfTrack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid rgba(255,214,10,.28)', background: 'rgba(255,214,10,.07)', borderRadius: 'var(--radius-lg)' }}>
              <Avatar name={nfOc.name} size={AV.lg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--yellow)', textTransform: 'uppercase', marginBottom: 3 }}>
                  On call this week · {nfTrack.name}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nfOc.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[nfOcContact!.ext, nfOcContact!.mobile].filter(Boolean).join(' · ')}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                shape="pill"
                onClick={() => {
                  const a = agents.find((x) => x.name === nfOc.name)
                  setState({ nf: { ...nf, assignee: a ? a.id : nf.assignee } })
                  toast(
                    a
                      ? 'Assigned to ' + nfOc.name + ' — on call for ' + nfTrack.name
                      : nfOc.name + ' is on call but outside the helpdesk roster — paged instead',
                    a ? 'var(--blue)' : 'var(--orange)',
                  )
                }}
              >
                Assign on-call
              </Button>
            </div>
          )}

          <div>
            <div style={sublabel}>Description</div>
            <textarea
              value={nf.body}
              onChange={(e) => setState({ nf: { ...nf, body: e.target.value } })}
              placeholder="What did the caller report? Steps already taken?"
              style={{
                width: '100%',
                minHeight: 96,
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
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface-2)' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.45, color: invalid ? 'var(--red)' : 'var(--ink-gray)' }}>
            {invalid
              ? 'Subject and requester are required.'
              : nf.assignee
                ? 'Relay will notify the assignee and start the SLA clock.'
                : 'Lands in the unassigned pool — anyone on the desk can pick it up.'}
          </span>
          <Button size="sm" variant="secondary" shape="pill" onClick={closeOverlays}>
            Cancel
          </Button>
          <Button
            size="sm"
            shape="pill"
            onClick={createTicket}
            iconRight={
              <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.75, letterSpacing: '.5px', border: '1px solid rgba(255,255,255,.35)', borderRadius: 5, padding: '1px 5px' }}>
                ⌘↩
              </span>
            }
          >
            Create &amp; assign
          </Button>
        </div>
      </div>
    </div>
  )
}
