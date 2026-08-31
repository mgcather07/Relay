import { useRelay } from '../store'
import { icons } from '../lib/icons'

export default function BulkBar() {
  const { state, setState, patch, toast } = useRelay()
  const s = state
  if (s.selected.length === 0) return null

  const actions = [
    { label: 'Assign', icon: icons.user, tint: 'var(--ink-1)', onClick: () => setState({ assignFor: '__bulk' }) },
    {
      label: 'Raise to P1',
      icon: icons.warn,
      tint: 'var(--red)',
      onClick: () => {
        patch(s.selected, { priority: 'P1', window: 240, due: Date.now() + 240 * 60000 })
        setState({ selected: [] })
        toast(s.selected.length + ' tickets raised to P1 — 4h target', 'var(--red)')
      },
    },
    {
      label: 'Resolve',
      icon: icons.check,
      tint: 'var(--green)',
      onClick: () => {
        patch(s.selected, { status: 'Resolved' })
        setState({ selected: [] })
        toast(s.selected.length + ' tickets resolved', 'var(--green)')
      },
    },
    { label: 'Merge', icon: icons.link, tint: 'var(--cyan)', onClick: () => setState({ merge: true }) },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 26,
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px 10px 18px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(28,32,38,.78)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--hairline)',
        boxShadow: '0 8px 24px rgba(0,0,0,.45)',
        animation: 'relay-pop .18s var(--ease-out)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.selected.length} selected</span>
      <span style={{ width: 1, height: 22, background: 'var(--hairline)' }} />
      {actions.map((b) => (
        <div
          key={b.label}
          className="relay-bulk-hover"
          onClick={b.onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: b.tint,
            padding: '7px 11px',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
          }}
        >
          {b.icon}
          {b.label}
        </div>
      ))}
      <span style={{ width: 1, height: 22, background: 'var(--hairline)' }} />
      <div
        className="relay-hover-white"
        onClick={() => setState({ selected: [] })}
        style={{ fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer', padding: '7px 10px' }}
      >
        Esc
      </div>
    </div>
  )
}
