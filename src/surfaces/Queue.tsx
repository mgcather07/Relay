import { useRelay } from '../store'
import { Badge, FilterChip, SegmentedControl, Avatar } from '../ds'
import { icons, channelIcon, checkMark } from '../lib/icons'
import { sla, prioColor, prioWord, statusTone, AV, type Ticket } from '../lib/data'
import { useIsCompact } from '../lib/useMediaQuery'

const GRID = '38px 12px minmax(280px,1fr) 168px 132px 150px 132px'
const VIEW_TITLES: Record<string, string> = {
  inbox: 'All open tickets',
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
  breaching: 'Breaching soon',
  waiting: 'Waiting on user',
  resolved: 'Resolved',
}

export default function Queue() {
  const { state, setState, filtered, viewTickets } = useRelay()
  const compact = useIsCompact()
  const s = state
  const rows = filtered()

  const breached = s.tickets.filter((x) => x.status !== 'Resolved' && x.due - s.now <= 0).length
  const unassignedCount = viewTickets('unassigned').length

  const chipDefs = ['P1', 'P2', 'Applications', 'Identity', 'Hardware', 'Infrastructure', 'Email']

  const allSelected = s.selected.length > 0 && s.selected.length === rows.length
  const gutter = compact ? 16 : 24

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Title row */}
      <div style={{ padding: `${compact ? 16 : 20}px ${gutter}px 14px`, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ fontSize: compact ? 22 : 26, fontWeight: 800, letterSpacing: '-.4px' }}>{VIEW_TITLES[s.view]}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>
            {rows.length} tickets · {breached} past SLA · {unassignedCount} waiting to be picked up
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!compact && (
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>Sort</span>
          )}
          <SegmentedControl segments={['SLA', 'Priority', 'Newest']} value={s.sortBy} onChange={(v) => setState({ sortBy: v })} />
        </div>
      </div>

      {/* Filter chips — horizontal scroll on compact */}
      <div
        style={{
          padding: `0 ${gutter}px 14px`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: compact ? 'nowrap' : 'wrap',
          overflowX: compact ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {chipDefs.map((c) => (
          <FilterChip
            key={c}
            selected={s.filters.indexOf(c) >= 0}
            tint={c === 'P1' ? 'var(--red)' : c === 'P2' ? 'var(--orange)' : 'var(--blue)'}
            style={compact ? { flexShrink: 0 } : undefined}
            onClick={() =>
              setState((st) => ({
                filters: st.filters.indexOf(c) >= 0 ? st.filters.filter((x) => x !== c) : st.filters.concat([c]),
              }))
            }
          >
            {c}
          </FilterChip>
        ))}
        <div
          className="relay-hover-white"
          onClick={() => setState({ filters: [] })}
          style={{ fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer', padding: '4px 8px', opacity: s.filters.length ? 1 : 0, flexShrink: 0 }}
        >
          Clear
        </div>
      </div>

      {/* Card list (compact) */}
      {compact ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: `0 ${gutter}px` }}>
          {rows.map((t) => (
            <Card key={t.id} t={t} />
          ))}
          {rows.length === 0 && (
            <div style={{ padding: '48px 16px', textAlign: 'center', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Nothing here</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>No tickets match this view and filter set.</div>
            </div>
          )}
          <div style={{ height: 96 }} />
        </div>
      ) : (
        <>
      {/* Table */}
      <div
        style={{
          margin: '0 24px',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          overflowX: 'auto',
          overflowY: 'hidden',
          background: 'var(--surface-2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            minWidth: 1020,
            alignItems: 'center',
            padding: '0 14px 0 6px',
            height: 38,
            background: 'rgba(255,255,255,.03)',
            borderBottom: '1px solid var(--hairline-soft)',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 'var(--tracking-label)',
            color: 'var(--ink-gray)',
            textTransform: 'uppercase',
          }}
        >
          <div
            onClick={() => setState((st) => ({ selected: st.selected.length === rows.length ? [] : rows.map((r) => r.id) }))}
            style={{ display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 4,
                border: '1.5px solid var(--hairline)',
                display: 'grid',
                placeItems: 'center',
                background: allSelected ? 'var(--blue)' : 'transparent',
              }}
            >
              {allSelected ? checkMark : null}
            </div>
          </div>
          <div />
          <div>Ticket</div>
          <div>Requester</div>
          <div>Status</div>
          <div>Assignee</div>
          <div style={{ textAlign: 'right' }}>SLA</div>
        </div>

        {/* Rows */}
        {rows.map((t) => (
          <Row key={t.id} t={t} />
        ))}

        {rows.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Nothing here</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>No tickets match this view and filter set.</div>
          </div>
        )}
      </div>
      <div style={{ height: 96 }} />
        </>
      )}
    </div>
  )
}

/* ── Compact card (phone / tablet) ─────────────────────────────────── */
function Card({ t }: { t: Ticket }) {
  const { state, agent, openDetail, slaWarnMinutes } = useRelay()
  const slaR = sla(t, state.now, slaWarnMinutes)
  const a = agent(t.assignee)
  return (
    <div
      className="relay-card-hover"
      onClick={() => openDetail(t.id)}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '13px 14px',
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 2, background: prioColor(t.priority) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{t.id}</span>
          <Badge tone={statusTone(t.status) as any}>{t.status === 'Waiting on user' ? 'Waiting' : t.status}</Badge>
          <div style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: slaR.color }}>
            {icons.clock}
            {slaR.text}
          </span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 7, color: t.status === 'Resolved' ? 'var(--ink-2)' : 'var(--ink-1)' }}>{t.subj}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-gray)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {channelIcon(t.channel)}
            {t.category}
          </span>
          <span>·</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.requester}</span>
          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Avatar name={a ? a.name : ''} size={AV.sm} />
            <span style={{ color: a ? 'var(--ink-2)' : 'var(--orange)' }}>{a ? (a.id === 'you' ? 'Me' : a.short) : 'Unassigned'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function Row({ t }: { t: Ticket }) {
  const { state, setState, agent, openDetail, slaWarnMinutes } = useRelay()
  const s = state
  const slaR = sla(t, s.now, slaWarnMinutes)
  const a = agent(t.assignee)
  const viewers = (t.viewers || []).map((v) => agent(v)).filter(Boolean) as any[]
  const sel = s.selected.indexOf(t.id) >= 0
  const rowHeight = 58

  return (
    <div
      className="relay-row-hover"
      onClick={() => openDetail(t.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        minWidth: 1020,
        alignItems: 'center',
        padding: '0 14px 0 6px',
        minHeight: rowHeight,
        borderBottom: '1px solid rgba(255,255,255,.05)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(10,132,255,.10)', pointerEvents: 'none', opacity: sel ? 1 : 0 }}
      />
      {/* checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          setState((st) => ({
            selected: st.selected.indexOf(t.id) >= 0 ? st.selected.filter((x) => x !== t.id) : st.selected.concat([t.id]),
          }))
        }}
        style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative', zIndex: 1 }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: 4,
            border: '1.5px solid var(--hairline)',
            display: 'grid',
            placeItems: 'center',
            background: sel ? 'var(--blue)' : 'transparent',
          }}
        >
          {sel ? checkMark : null}
        </div>
      </div>
      {/* priority bar */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
        <div
          title={t.priority + ' · ' + prioWord(t.priority)}
          style={{ width: 4, height: 26, borderRadius: 3, background: prioColor(t.priority) }}
        />
      </div>
      {/* ticket cell */}
      <div style={{ position: 'relative', zIndex: 1, minWidth: 0, paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)', flexShrink: 0 }}>
            {t.id}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: t.status === 'Resolved' ? 'var(--ink-2)' : 'var(--ink-1)',
            }}
          >
            {t.subj}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--ink-gray)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {channelIcon(t.channel)}
            {t.channel}
          </span>
          <span>·</span>
          <span>{t.category}</span>
          {(t.links || []).length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--cyan)' }}>
              {icons.link}
              {(t.links || []).length}
            </span>
          )}
          {viewers.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'relay-pulse 2s infinite' }} />
              {viewers[0].short.replace('.', '')} viewing
            </span>
          )}
        </div>
      </div>
      {/* requester */}
      <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.requester}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>{t.dept}</div>
      </div>
      {/* status */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Badge tone={statusTone(t.status) as any} style={{ whiteSpace: 'nowrap' }}>
          {t.status === 'Waiting on user' ? 'Waiting' : t.status}
        </Badge>
      </div>
      {/* assignee */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="relay-assign-hover"
          onClick={(e) => {
            e.stopPropagation()
            setState({ assignFor: t.id })
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '4px 9px 4px 4px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${a ? 'var(--hairline-soft)' : 'rgba(255,159,10,.4)'}`,
            cursor: 'pointer',
          }}
        >
          <Avatar name={a ? a.name : ''} size={AV.sm} />
          <span style={{ fontSize: 12, color: a ? 'var(--ink-1)' : 'var(--orange)', whiteSpace: 'nowrap' }}>
            {a ? (a.id === 'you' ? 'Me' : a.short) : 'Unassigned'}
          </span>
        </div>
      </div>
      {/* SLA */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: slaR.color }}>{slaR.text}</div>
        <div
          style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.08)', marginTop: 5, marginLeft: 'auto', width: 76, overflow: 'hidden' }}
        >
          <div style={{ height: '100%', borderRadius: 2, background: slaR.color, width: slaR.pct + '%' }} />
        </div>
      </div>
    </div>
  )
}
