import { useRelay } from '../store'
import { Avatar, Button, FilterChip, SegmentedControl } from '../ds'
import { agents, tracks, catTrack, onCallFor, monday, AV } from '../lib/data'
import { useIsPhone } from '../lib/useMediaQuery'

const sublabel: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--ink-gray)',
  textTransform: 'uppercase',
  marginBottom: 7,
}

export default function NewTicketModal() {
  const { state, setState, closeOverlays, createTicket, toast } = useRelay()
  const phone = useIsPhone()
  const s = state
  if (!s.composer) return null

  const nf = s.nf
  const invalid = nf.tried && (!nf.subject.trim() || !nf.requester.trim())
  const slaPreview =
    'Resolution target ' +
    ({ P1: '4h', P2: '8h', P3: '24h', P4: '48h' } as Record<string, string>)[nf.priority] +
    ' · first reply ' +
    ({ P1: '15m', P2: '30m', P3: '4h', P4: '1d' } as Record<string, string>)[nf.priority]

  const mon = monday(new Date(s.now))
  const nfTrackId = catTrack[nf.category] || 'hd'
  const nfTrack = tracks.find((t) => t.id === nfTrackId)!
  const nfOc = onCallFor(nfTrackId, mon)!

  return (
    <div
      onClick={closeOverlays}
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
          width: 640,
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
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>New ticket</div>
            <div style={{ fontSize: 12, color: 'var(--ink-gray)', marginTop: 2 }}>Logging on behalf of a caller · RLY-2842</div>
          </div>
          <div onClick={closeOverlays} style={{ fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
            Esc
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 15, overflowY: 'auto', minHeight: 0, flex: 1 }}>
          <div>
            <div style={sublabel}>Subject</div>
            <input
              value={nf.subject}
              onChange={(e) => setState({ nf: { ...nf, subject: e.target.value } })}
              placeholder="One line — what's broken?"
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                background: 'var(--surface-inset)',
                border: `1px solid ${nf.tried && !nf.subject.trim() ? 'var(--red)' : 'var(--hairline-soft)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--ink-1)',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 12 }}>
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

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <div style={{ ...sublabel, marginBottom: 0 }}>Priority</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{slaPreview}</div>
            </div>
            <SegmentedControl segments={['P1', 'P2', 'P3', 'P4']} value={nf.priority} onChange={(v) => setState({ nf: { ...nf, priority: v as any } })} style={{ width: '100%' }} />
          </div>

          {/* On-call strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid rgba(255,214,10,.28)', background: 'rgba(255,214,10,.07)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap' }}>
            <Avatar name={nfOc.name} size={AV.lg} />
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--yellow)', textTransform: 'uppercase', marginBottom: 3 }}>
                On call this week · {nfTrack.name}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nfOc.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', fontVariantNumeric: 'tabular-nums' }}>
                {nfOc.ext} · {nfOc.mobile}
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

          <div>
            <div style={sublabel}>Assign to</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {agents.map((a) => {
                const sel = nf.assignee === a.id
                return (
                  <div
                    key={a.id}
                    onClick={() => setState({ nf: { ...nf, assignee: a.id } })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 12px 5px 5px',
                      borderRadius: 'var(--radius-pill)',
                      border: `1px solid ${sel ? 'var(--blue)' : 'var(--hairline-soft)'}`,
                      background: sel ? 'rgba(10,132,255,.16)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <Avatar name={a.name} size={AV.sm} />
                    <span style={{ fontSize: 12.5, color: sel ? 'var(--ink-1)' : 'var(--ink-2)' }}>{a.id === 'you' ? 'Me' : a.short}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={sublabel}>Description</div>
            <textarea
              value={nf.body}
              onChange={(e) => setState({ nf: { ...nf, body: e.target.value } })}
              placeholder="What did the caller report? Steps already taken?"
              style={{
                width: '100%',
                minHeight: 100,
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
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap', background: 'var(--surface-2)' }}>
          <span style={{ fontSize: 12, color: invalid ? 'var(--red)' : 'var(--ink-gray)' }}>
            {invalid ? 'Subject and requester are required.' : 'Relay will notify the assignee and start the SLA clock.'}
          </span>
          <div style={{ flex: 1 }} />
          <Button size="sm" variant="secondary" shape="pill" onClick={closeOverlays}>
            Cancel
          </Button>
          <Button size="sm" shape="pill" onClick={createTicket}>
            Create &amp; assign
          </Button>
        </div>
      </div>
    </div>
  )
}
