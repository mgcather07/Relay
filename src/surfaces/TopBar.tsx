import { useRelay } from '../store'
import { Avatar, Button, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { agents, AV } from '../lib/data'
import { useIsCompact, useIsPhone } from '../lib/useMediaQuery'

export default function TopBar() {
  const { state, setState } = useRelay()
  const compact = useIsCompact()
  const phone = useIsPhone()
  const onShift = agents.slice(0, 4).map((a) => ({ name: a.name, title: a.name + ' — ' + a.avail }))
  const showHamburger = compact && state.surface === 'Desk'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: phone ? 8 : 16,
        rowGap: 8,
        minHeight: 56,
        padding: phone ? '8px 12px' : '0 16px',
        flexShrink: 0,
        flexWrap: compact ? 'wrap' : 'nowrap',
        background: 'rgba(20,23,28,.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--hairline-soft)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Hamburger (Desk, compact) */}
      {showHamburger && (
        <div
          onClick={() => setState((s) => ({ navOpen: !s.navOpen }))}
          className="relay-hover-white"
          style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--ink-1)', flexShrink: 0 }}
          aria-label="Open navigation"
        >
          {icons.menu}
        </div>
      )}

      {/* Logo */}
      <div
        onClick={() => setState({ surface: 'Desk', page: 'queue', view: 'inbox', navOpen: false })}
        style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', paddingRight: phone ? 0 : 8, flexShrink: 0 }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--sector-navy)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 4px rgba(10,132,255,.18)' }} />
        </div>
        {!phone && <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>}
      </div>

      {/* Search pill → command palette */}
      <div
        className="relay-search-hover"
        onClick={() => setState({ palette: true, paletteQ: '', paletteIdx: 0 })}
        style={{
          flex: '1 1 160px',
          minWidth: phone ? 0 : compact ? 140 : 250,
          maxWidth: 520,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          height: 34,
          padding: '0 12px',
          background: 'var(--surface-inset)',
          border: '1px solid var(--hairline-soft)',
          borderRadius: 'var(--radius-pill)',
          cursor: 'text',
          color: 'var(--ink-3)',
          fontSize: 13,
        }}
      >
        {icons.search}
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '34px' }}>
          {phone ? 'Search…' : 'Search tickets, people, commands…'}
        </span>
        {!phone && (
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: 'var(--ink-2)', background: 'rgba(255,255,255,.07)', border: '1px solid var(--hairline-soft)', borderRadius: 6, padding: '2px 6px' }}>
            ⌘K
          </span>
        )}
      </div>

      {/* Online now (desktop only) */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>Online now</span>
          <div style={{ display: 'flex' }}>
            {onShift.map((a) => (
              <div key={a.name} title={a.title} style={{ marginLeft: -6, borderRadius: '50%', boxShadow: '0 0 0 2px var(--app-bg)' }}>
                <Avatar name={a.name} size={AV.sm} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View switcher — Staff workspace vs end-user Help center.
          Device (desktop/phone) is auto-detected via responsive layout. */}
      <SegmentedControl
        segments={[
          { value: 'Desk', label: 'Staff' },
          { value: 'Portal', label: 'Help center' },
        ]}
        value={state.surface}
        onChange={(v) => setState({ surface: v as any, navOpen: false })}
        style={{ flex: phone ? '1 1 100%' : '0 0 auto', order: phone ? 5 : 0, whiteSpace: 'nowrap', minWidth: phone ? 0 : 200 }}
      />

      {/* New ticket */}
      <Button size="sm" shape="pill" onClick={() => setState({ composer: true })} icon={icons.plus} style={{ flexShrink: 0 }}>
        {phone ? '' : 'New ticket'}
      </Button>
    </div>
  )
}
