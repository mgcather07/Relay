import { useRelay } from '../store'
import { icons } from '../lib/icons'

export default function ToastView() {
  const { state } = useRelay()
  if (!state.toast) return null
  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 22,
        zIndex: 95,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(28,32,38,.9)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--hairline)',
        boxShadow: '0 8px 24px rgba(0,0,0,.45)',
        animation: 'relay-pop .18s var(--ease-out)',
        maxWidth: 360,
      }}
    >
      <span style={{ display: 'inline-flex', color: state.toast.tint }}>{icons.check}</span>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{state.toast.text}</div>
    </div>
  )
}
