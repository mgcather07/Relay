import { useRelay } from '../store'
import { SegmentedControl } from '../ds'
import { prioColor } from '../lib/data'

// Stable pseudo-similarity so the value doesn't flicker on the 1s SLA tick.
function similarity(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return (60 + (h % 20)) + '%'
}

export default function MergeModal() {
  const { state, setState, closeOverlays, openTicket, toast } = useRelay()
  const s = state
  if (!s.merge) return null

  const t = openTicket() || ({} as any)
  const sourceId = s.selected.length > 1 ? s.selected.length + ' tickets' : t.id || ''
  const verb = s.mergeMode === 'Merge as duplicate' ? 'Merge' : s.mergeMode === 'Link as related' ? 'Link' : 'Nest'
  const candidates = s.tickets.filter((x) => x.id !== t.id).slice(0, 6)

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
        padding: '7vh 20px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '94vw',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          overflow: 'hidden',
          animation: 'relay-pop .18s var(--ease-out)',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>Link or merge {sourceId}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-gray)', marginTop: 2 }}>Merging moves the conversation and closes the duplicate.</div>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline-soft)' }}>
          <SegmentedControl
            segments={['Merge as duplicate', 'Link as related', 'Make child of']}
            value={s.mergeMode}
            onChange={(v) => setState({ mergeMode: v })}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {candidates.map((x) => (
            <div
              key={x.id}
              className="relay-soft-hover"
              onClick={() => {
                setState({ merge: false, selected: [] })
                const verbPast = s.mergeMode
                  .replace('Merge as duplicate', 'Merged')
                  .replace('Link as related', 'Linked')
                  .replace('Make child of', 'Nested')
                toast(verbPast + ' into ' + x.id + ' — thread moved', 'var(--cyan)')
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)' }}
            >
              <span style={{ width: 4, height: 28, borderRadius: 2, background: prioColor(x.priority) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.subj}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>
                  {x.id} · {x.category} · {similarity(x.id)} similar
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>{verb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
