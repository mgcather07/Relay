import { useState } from 'react'
import { useRelay } from '../store'
import { Avatar, Badge, Button } from '../ds'
import { icons } from '../lib/icons'
import { agents, AV, ROLE_LABEL, type Role } from '../lib/data'
import { useIsCompact, useIsPhone } from '../lib/useMediaQuery'

const roleTone: Record<Role, any> = {
  developer: 'purple',
  admin: 'poor',
  manager: 'purple',
  staff: 'cyan',
  helpdesk: 'accent',
  employee: 'prime',
}

function UserMenu() {
  const { currentUser, signOut } = useRelay()
  const phone = useIsPhone()
  const [open, setOpen] = useState(false)
  const me = currentUser()
  if (!me) return null

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        className="relay-assign-hover"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--hairline-soft)', cursor: 'pointer' }}
      >
        <Avatar name={me.name} size={AV.sm} ring />
        {!phone && <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>{me.name.split(' ')[0]}</span>}
        <span style={{ color: 'var(--ink-3)', display: 'inline-flex' }}>{icons.chevron}</span>
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 99,
              width: 244,
              background: 'var(--surface-2)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,.5)',
              overflow: 'hidden',
              animation: 'relay-pop .16s var(--ease-out)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 14px 12px' }}>
              <Avatar name={me.name} size={AV.lg} ring />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{me.title}</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone={roleTone[me.role]}>{ROLE_LABEL[me.role]}</Badge>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>role from LDAP group</span>
            </div>
            <div
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="relay-soft-hover"
              style={{ padding: '12px 14px', borderTop: '1px solid var(--hairline-soft)', fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}
            >
              {icons.portal}
              <span>Sign out</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function TopBar() {
  const { state, setState, caps } = useRelay()
  const compact = useIsCompact()
  const phone = useIsPhone()
  const isEmployee = caps().isEmployee
  const onShift = agents.slice(0, 4).map((a) => ({ name: a.name, title: a.name + ' — ' + a.avail }))
  const showHamburger = compact && !isEmployee

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        columnGap: phone ? 8 : 16,
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
      {/* Hamburger (agents, compact) */}
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
        onClick={() => !isEmployee && setState({ page: 'queue', view: 'inbox', navOpen: false })}
        style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: isEmployee ? 'default' : 'pointer', paddingRight: phone ? 0 : 8, flexShrink: 0 }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--sector-navy)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 4px rgba(10,132,255,.18)' }} />
        </div>
        {!phone && <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '1.4px' }}>RELAY</div>}
      </div>

      {/* Search pill → command palette (agents only) */}
      {!isEmployee && (
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
      )}

      {/* Employee: help center label fills the space */}
      {isEmployee && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>Help center</span>
        </div>
      )}

      {/* Online now (agents, desktop) */}
      {!compact && !isEmployee && (
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

      {/* New ticket (agents) */}
      {!isEmployee && (
        <Button size="sm" shape="pill" onClick={() => setState({ composer: true })} icon={icons.plus} style={{ flexShrink: 0 }}>
          {phone ? '' : 'New ticket'}
        </Button>
      )}

      {/* User menu + sign out */}
      <UserMenu />
    </div>
  )
}
