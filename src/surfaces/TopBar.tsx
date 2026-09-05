import { useRelay } from '../store'
import { useSession } from '../session'
import { Avatar, Button, SegmentedControl } from '../ds'
import { icons } from '../lib/icons'
import { AV } from '../lib/data'

export default function TopBar() {
  const { state, setState, agents, me, isRequester } = useRelay()
  const session = useSession()
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
        onClick={() => (isRequester ? setState({ portalPage: 'list' }) : setState({ surface: 'Desk', page: 'queue', view: 'inbox' }))}
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
        {state.org.name && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', borderLeft: '1px solid var(--hairline-soft)', paddingLeft: 10, whiteSpace: 'nowrap' }}>
            {state.org.name}
          </div>
        )}
      </div>

      {/* Requesters get a slim bar: logo, org, sign out */}
      {isRequester ? (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={me.name} size={AV.sm} />
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{me.name}</span>
            <span onClick={() => session.signOutUser()} style={{ fontSize: 12.5, color: 'var(--blue)', cursor: 'pointer' }}>
              Sign out
            </span>
          </div>
        </>
      ) : (
        <>
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
          {onShift.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4, flexShrink: 0 }}>
              <span
                title="Agents in this workspace"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-label)',
                  color: 'var(--ink-gray)',
                  textTransform: 'uppercase',
                }}
              >
                Team
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
          )}

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
        </>
      )}
    </div>
  )
}
