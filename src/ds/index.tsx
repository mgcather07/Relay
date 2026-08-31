import React from 'react'

/* ─────────────────────────────────────────────────────────────────────────
   Sector design system — core components, recreated from the bundled
   reference (design_system/_ds_bundle.js). Styling values are exact.
   ───────────────────────────────────────────────────────────────────────── */

type CSS = React.CSSProperties

/* ── Avatar ─────────────────────────────────────────────────────────── */
export function Avatar({
  src = null,
  name = '',
  size = 44,
  ring = false,
  style = {},
  ...rest
}: {
  src?: string | null
  name?: string
  size?: number
  ring?: boolean
  style?: CSS
} & React.HTMLAttributes<HTMLDivElement>) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      {...rest}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: 'var(--sector-navy)',
        color: '#fff',
        fontFamily: 'var(--font-system)',
        fontSize: size * 0.38,
        fontWeight: 700,
        border: ring ? '2px solid var(--blue)' : '1px solid var(--hairline)',
        boxShadow: ring ? '0 0 0 2px var(--app-bg)' : 'none',
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials || '?'
      )}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────── */
export type BadgeTone =
  | 'prime'
  | 'good'
  | 'fair'
  | 'poor'
  | 'accent'
  | 'cyan'
  | 'purple'
  | 'neutral'

export function Badge({
  children,
  tone = 'neutral',
  solid = false,
  icon = null,
  style = {},
  ...rest
}: {
  children?: React.ReactNode
  tone?: BadgeTone
  solid?: boolean
  icon?: React.ReactNode
  style?: CSS
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tints: Record<string, string> = {
    prime: 'var(--green)',
    good: 'var(--mint)',
    fair: 'var(--orange)',
    poor: 'var(--red)',
    accent: 'var(--blue)',
    cyan: 'var(--cyan)',
    purple: 'var(--purple)',
    neutral: 'var(--ink-gray)',
  }
  const c = tints[tone] || tints.neutral
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-system)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        color: solid ? '#04130a' : c,
        background: solid ? c : `color-mix(in srgb, ${c} 18%, transparent)`,
        border: solid ? 'none' : `1px solid color-mix(in srgb, ${c} 35%, transparent)`,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  )
}

/* ── Button ─────────────────────────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  icon = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  style = {},
  ...rest
}: {
  children?: React.ReactNode
  variant?: 'primary' | 'navy' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded' | 'pill'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  disabled?: boolean
  style?: CSS
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes: Record<string, CSS> = {
    sm: { padding: '8px 16px', fontSize: 14, gap: 6, minHeight: 36 },
    md: { padding: '12px 22px', fontSize: 16, gap: 8, minHeight: 46 },
    lg: { padding: '15px 28px', fontSize: 17, gap: 9, minHeight: 52 },
  }
  const variants: Record<string, CSS> = {
    primary: { background: 'var(--blue)', color: '#fff', border: 'none' },
    navy: { background: 'var(--sector-navy)', color: '#fff', border: '1px solid var(--hairline)' },
    secondary: {
      background: 'var(--surface-3)',
      color: 'var(--ink-1)',
      border: '1px solid var(--hairline)',
    },
    ghost: { background: 'transparent', color: 'var(--blue)', border: 'none' },
    destructive: { background: 'var(--red)', color: '#fff', border: 'none' },
  }
  const s = sizes[size] || sizes.md
  const v = variants[variant] || variants.primary
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: (s as any).gap,
        padding: (s as any).padding,
        minHeight: (s as any).minHeight,
        width: fullWidth ? '100%' : 'auto',
        fontFamily: 'var(--font-system)',
        fontSize: (s as any).fontSize,
        fontWeight: 600,
        lineHeight: 1,
        borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition:
          'transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)',
        WebkitTapHighlightColor: 'transparent',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(var(--press-scale))'
      }}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex' }}>{iconRight}</span>}
    </button>
  )
}

/* ── Card ───────────────────────────────────────────────────────────── */
export function Card({
  children,
  caption = null,
  trailing = null,
  elevated = false,
  padding = 16,
  style = {},
  ...rest
}: {
  children?: React.ReactNode
  caption?: React.ReactNode
  trailing?: React.ReactNode
  elevated?: boolean
  padding?: number
  style?: CSS
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: elevated ? 'var(--surface-3)' : 'var(--surface-2)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-xl)',
        padding,
        color: 'var(--ink-1)',
        fontFamily: 'var(--font-system)',
        ...style,
      }}
    >
      {(caption || trailing) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          {caption && (
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-gray)', fontWeight: 500 }}>
              {caption}
            </span>
          )}
          {trailing}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── FilterChip ─────────────────────────────────────────────────────── */
export function FilterChip({
  children,
  selected = false,
  tint = 'var(--blue)',
  icon = null,
  onClick,
  style = {},
  ...rest
}: {
  children?: React.ReactNode
  selected?: boolean
  tint?: string
  icon?: React.ReactNode
  onClick?: () => void
  style?: CSS
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      {...rest}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        minHeight: 36,
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-system)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        color: selected ? '#fff' : 'var(--ink-2)',
        background: selected ? tint : 'var(--surface-3)',
        border: `1px solid ${selected ? 'transparent' : 'var(--hairline)'}`,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  )
}

/* ── SegmentedControl ───────────────────────────────────────────────── */
export function SegmentedControl({
  segments = [],
  value,
  onChange,
  style = {},
}: {
  segments: (string | { value: string; label: string })[]
  value: string
  onChange?: (v: string) => void
  style?: CSS
}) {
  const idx = Math.max(
    0,
    segments.findIndex((s) => ((s as any).value ?? s) === value),
  )
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${segments.length}, 1fr)`,
        padding: 3,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline-soft)',
        fontFamily: 'var(--font-system)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: `calc(3px + ${idx} * ((100% - 6px) / ${segments.length}))`,
          width: `calc((100% - 6px) / ${segments.length})`,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--blue)',
          transition: 'left var(--duration-base) var(--ease-out)',
        }}
      />
      {segments.map((s) => {
        const v = (s as any).value ?? s
        const label = (s as any).label ?? s
        const active = v === value
        return (
          <button
            key={v}
            onClick={() => onChange && onChange(v)}
            style={{
              position: 'relative',
              zIndex: 1,
              border: 'none',
              background: 'transparent',
              padding: '8px 10px',
              fontFamily: 'var(--font-system)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              color: active ? '#fff' : 'var(--ink-2)',
              transition: 'color var(--duration-fast) var(--ease-standard)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
