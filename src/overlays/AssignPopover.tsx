import { useRelay } from '../store'
import { Avatar, Badge } from '../ds'
import { AV } from '../lib/data'

export default function AssignPopover() {
  const { state, closeOverlays, assignTo, unassign, agents } = useRelay()
  const s = state
  if (!s.assignFor) return null

  const title = s.assignFor === '__bulk' ? 'Assign ' + s.selected.length + ' tickets' : 'Assign ' + s.assignFor

  const candidates = agents
    .slice()
    .sort((a, b) => a.load - b.load)
    .map((a, i) => ({
      id: a.id,
      name: a.name,
      team: a.team,
      load: a.load,
      statusText: a.avail,
      suggested: i === 0,
      tint: a.load > 10 ? 'var(--red)' : a.load > 7 ? 'var(--orange)' : 'var(--green)',
    }))

  return (
    <div
      onClick={closeOverlays}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(3,5,8,.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '8vh 20px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: '92vw',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          overflow: 'hidden',
          animation: 'relay-pop .18s var(--ease-out)',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-gray)', marginTop: 2 }}>Sorted by open load. Relay suggests the lightest qualified tech.</div>
        </div>
        <div style={{ maxHeight: 340, overflow: 'auto' }}>
          {candidates.map((a) => (
            <div
              key={a.id}
              className="relay-soft-hover"
              onClick={() => assignTo(a.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)' }}
            >
              <Avatar name={a.name} size={AV.lg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</span>
                  {a.suggested && <Badge tone="accent">Suggested</Badge>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', marginTop: 2 }}>
                  {a.statusText ? a.team + ' · ' + a.statusText : a.team}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: a.tint }}>{a.load}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>open</div>
              </div>
            </div>
          ))}
        </div>
        <div className="relay-hover-white" onClick={unassign} style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer' }}>
          Return to unassigned pool
        </div>
      </div>
    </div>
  )
}
