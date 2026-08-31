import { useRelay } from '../store'
import { icons, type IconKey } from '../lib/icons'

export default function CommandPalette() {
  const { state, setState, closeOverlays, paletteList } = useRelay()
  const s = state
  if (!s.palette) return null

  const results = paletteList()

  return (
    <div
      onClick={closeOverlays}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(3,5,8,.62)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '9vh 20px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: '94vw',
          maxHeight: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(28,32,38,.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 24px rgba(0,0,0,.55)',
          overflow: 'hidden',
          animation: 'relay-pop .16s var(--ease-out)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid var(--hairline-soft)', flexShrink: 0 }}>
          <span style={{ color: 'var(--ink-3)' }}>{icons.search}</span>
          <input
            value={s.paletteQ}
            onChange={(e) => setState({ paletteQ: e.target.value, paletteIdx: 0 })}
            autoFocus
            placeholder="Jump to a ticket, or type a command…"
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--ink-1)', fontSize: 16 }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', background: 'rgba(255,255,255,.07)', border: '1px solid var(--hairline-soft)', borderRadius: 6, padding: '2px 6px' }}>
            ESC
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6 }}>
          {results.map((p, i) => {
            const active = i === s.paletteIdx
            const icon = icons[(p.icon as IconKey)] || icons.ticket
            return (
              <div
                key={i}
                onClick={() => p.run()}
                onMouseEnter={() => setState({ paletteIdx: i })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)', background: 'rgba(10,132,255,.16)', pointerEvents: 'none', opacity: active ? 1 : 0 }} />
                <span style={{ display: 'inline-flex', color: p.tint || 'var(--ink-2)', position: 'relative', width: 18, justifyContent: 'center' }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.meta}</div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--ink-3)', position: 'relative' }}>{p.kind}</span>
              </div>
            )
          })}
          {results.length === 0 && (
            <div style={{ padding: '28px 14px', textAlign: 'center', fontSize: 13, color: 'var(--ink-2)' }}>No matches for “{s.paletteQ}”</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 16px', borderTop: '1px solid var(--hairline-soft)', fontSize: 11, color: 'var(--ink-gray)', flexShrink: 0, flexWrap: 'wrap' }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>⌘K toggle</span>
          <div style={{ flex: 1 }} />
          <span>C new ticket · E resolve · / search</span>
        </div>
      </div>
    </div>
  )
}
