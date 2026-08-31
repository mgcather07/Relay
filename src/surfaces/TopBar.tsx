import { useRelay } from '../store'
import { Avatar, Button, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { agents, AV } from '../lib/data'

export default function TopBar() {
  const { state, setState } = useRelay()
  const onShift = agents.slice(0, 4).map((a) => ({ name: a.name, title: a.name + ' — ' + a.avail }))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 56,
        padding: '0 16px',
        flexShrink: 0,
        background: 'rgba(20,23,28,.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--hairline-soft)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => setState({ surface: 'Desk', page: 'queue', view: 'inbox' })}
        style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', paddingRight: 8 }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'var(--sector-navy)',
            border: '1px solid var(--hairline)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: 'var(--blue)',
              boxShadow: '0 0 0 4px rgba(10,132,255,.18)',
            }}
          />
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>
      </div>

      {/* Search pill → command palette */}
      <div
        className="relay-search-hover"
        onClick={() => setState({ palette: true, paletteQ: '', paletteIdx: 0 })}
        style={{
          flex: '1 1 260px',
          minWidth: 250,
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
        <span
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '34px',
          }}
        >
          Search tickets, people, commands…
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.5px',
            color: 'var(--ink-2)',
            background: 'rgba(255,255,255,.07)',
            border: '1px solid var(--hairline-soft)',
            borderRadius: 6,
            padding: '2px 6px',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Online now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4, flexShrink: 0 }}>
        <span
          title="Agents signed in and taking work right now"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 'var(--tracking-label)',
            color: 'var(--ink-gray)',
            textTransform: 'uppercase',
          }}
        >
          Online now
        </span>
        <div style={{ display: 'flex' }}>
          {onShift.map((a) => (
            <div
              key={a.name}
              title={a.title}
              style={{ marginLeft: -6, borderRadius: '50%', boxShadow: '0 0 0 2px var(--app-bg)' }}
            >
              <Avatar name={a.name} size={AV.sm} />
            </div>
          ))}
        </div>
      </div>

      {/* Surface switcher */}
      <SegmentedControl
        segments={['Desk', 'Portal', 'Mobile']}
        value={state.surface}
        onChange={(v) => setState({ surface: v as any })}
        style={{ flexShrink: 0, whiteSpace: 'nowrap', minWidth: 236 }}
      />

      {/* New ticket */}
      <Button size="sm" shape="pill" onClick={() => setState({ composer: true })} icon={icons.plus}>
        New ticket
      </Button>
    </div>
  )
}
